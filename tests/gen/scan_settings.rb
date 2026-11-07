# Builds the data for lich-yaml-settings.html from dr-scripts and lich-5.
Encoding.default_external = Encoding::UTF_8
require 'yaml'; require 'json'; require 'date'
drs, lich = ARGV
base_path = File.join(drs, 'profiles/base.yaml')
base = YAML.unsafe_load_file(base_path)
METHODS = %w[respond_to to_h to_hash each keys values dig fetch key? include? merge nil? empty? any? select map to_a send respond_to? instance_variable_get class is_a? public_send freeze dup each_pair has_key? method_missing].freeze
# ── base.yaml: description (comment block right above the key, reset per key),
#    section (last banner seen), example (commented YAML right below the key)
info = {}; block = []; section = 'General'; last_key = nil; ex_open = false
banner = ->(t) { x = t[/^[#\s]*([A-Za-z][\w\/ ()&-]{1,30}?)\s+settings?[\s#:]*$/i, 1]; x && x !~ /pattern hues/i ? x : nil }
hash_banner = false # HASHBANNER
File.readlines(base_path, chomp: true).each do |l|
  if l =~ /^\#{4,}\s*$/ then hash_banner = true; next end
  if hash_banner && l =~ /^#\s*(\S.*)$/ then section = $1.strip.sub(/\s*settings?\s*$/i, ''); hash_banner = false; block = []; next end
  hash_banner = false
  if l =~ /^#(.*)$/
    t = $1
    if ex_open && last_key && (t =~ /^\s*-\s/ || t =~ /^\s+[\w:]+:/ || t =~ /^\s*[a-z_]+:\s/)
      info[last_key][:example] << t.sub(/^ /, '') << "\n"; next
    end
    ex_open = false
    t = t.strip
    next if t.empty? || t =~ /^-\s/ || t =~ /^[a-z_]+:(\s|$)/
    block << t
  elsif l =~ /^([A-Za-z_]\w*):/
    key = $1
    if (b = block.map { |x| banner.(x) }.compact.first) then section = b.strip.sub(/\A./, &:upcase) end
    desc = block.reject { |x| x =~ %r{^https?://} || banner.(x) }.join(' ')
    info[key] = { desc: desc, section: section, example: +'' }
    block = []; last_key = key; ex_open = true
  elsif l.strip.empty?
    if (b = block.map { |x| banner.(x) }.compact.first) then section = b.strip.sub(/\A./, &:upcase) end
    block = []; ex_open = false
  else
    block = []
  end
end
# base.yaml's skinning banner is followed by many combat keys
info.each { |k, v| v[:section] = 'Combat' if v[:section] == 'Skinning/dissect' && k !~ /skin|dissect|arrange|thanat|corpse|bundle|butcher/ }
# ── code scan
files = Dir[File.join(drs, '*.lic')].sort.map { |f| [File.basename(f), f] } +
        (Dir[File.join(lich, 'lib/dragonrealms/**/*.rb')] + %w[lib/common/settings_transformer.rb lib/common/map/map_base.rb lib/common/setup_files.rb].map { |f| File.join(lich, f) }.select { |f| File.exist?(f) })
        .sort.map { |f| ["lich: #{File.basename(f)}", f] }
reads = Hash.new { |h, k| h[k] = [] }; first = {}; assigned = {}; dynamic = []
recv = '(?<![\w.])(?:@?settings|get_settings(?:\([^)]*\))?)'
dot = /#{recv}(?:&?\.)([a-z_][a-z0-9_]*[?]?)/
idx = /#{recv}(?:&?\.(?:fetch|dig)\(|\[)\s*['":]([a-z_][a-z0-9_]*)['"]?/
assign = /#{recv}(?:\.([a-z_][a-z0-9_]*)|\[['":]([a-z_][a-z0-9_]*)['"]?\])\s*=[^=~]/
dyn = /#{recv}(?:\[|&?\.(?:fetch|dig|send)\()\s*"[^"]*#\{/
lit = /['":]([a-z][a-z0-9]*_[a-z0-9_]+)['"]?/
files.each do |label, path|
  File.readlines(path).each_with_index do |line, i|
    code = line.sub(/(^|\s)#(?!\{).*$/, '')
    next if code.strip.empty?
    keys = code.scan(dot).flatten.map { |k| k.chomp('?') }.reject { |k| METHODS.include?(k) } + code.scan(idx).flatten
    keys += code.scan(lit).flatten.select { |k| base.key?(k) } if label.start_with?('lich: ') || code =~ /settings|setup/
    keys.uniq.each do |k|
      reads[k] << label unless reads[k].include?(label)
      first[k] ||= "#{label.sub('lich: ', '')}:#{i + 1}: #{code.strip[0, 160]}"
    end
    code.scan(assign).each { |a, b| assigned[a || b] ||= "#{label.sub('lich: ', '')}:#{i + 1}" }
    dynamic << [code.strip[/"[^"]*#\{[^"]*"/] || code.strip[0, 60], label.sub('lich: ', '')] if code =~ dyn
  end
end
dump = ->(k, v) { YAML.dump({ k => v }).sub(/\A---\n/, '').sub(/\n\z/, '') }
rows = base.map do |k, v|
  i = info[k] || { desc: '', section: 'General', example: '' }
  default = v.nil? ? '' : (v.is_a?(Hash) || v.is_a?(Array) ? dump.(k, v).sub(/\A#{Regexp.escape(k)}:\s*\n?/, '') : (v.is_a?(Regexp) ? "!ruby/regexp #{v.inspect}" : v.to_s))
  status = []
  status << 'deprecated' if i[:desc] =~ /deprecat|no longer (used|needed)|obsolete/i
  status << 'set by a script' if assigned[k]
  { key: k, default: default, yaml: v.nil? ? "#{k}:" : dump.(k, v), desc: i[:desc], section: i[:section], example: i[:example].rstrip,
    scripts: reads[k].sort_by { |s| [s.start_with?('lich: ') ? 1 : 0, s] }, in_base: true, ref: '', status: status, set_at: assigned[k] || '' }
end
ignore = %w[new each first last size length count keys values].freeze
(reads.keys - base.keys).sort.each do |k|
  next if ignore.include?(k) || k.length < 4
  rows << { key: k, default: '', yaml: "#{k}:", desc: '', section: 'Not in base.yaml', example: '', scripts: reads[k].sort, in_base: false,
            ref: first[k], status: assigned[k] ? ['set by a script'] : [], set_at: assigned[k] || '' }
end
c = ->(d) { `git -C #{d} rev-parse --short HEAD`.strip }
puts JSON.generate({ rows: rows, dynamic: dynamic.uniq.first(40), n_files: files.size, dr_commit: c.(drs), lich_commit: c.(lich), date: Date.today.strftime('%b %-d, %Y') })

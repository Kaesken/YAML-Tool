Encoding.default_external = Encoding::UTF_8
require 'yaml'; require 'json'
drs = ARGV[0]
base_path = File.join(drs, 'profiles/base.yaml')
base = YAML.unsafe_load_file(base_path)
conv = lambda do |x|
  case x
  when Hash then x.each_with_object({}) { |(k, v), h| h[k.is_a?(Symbol) ? ":#{k}" : k.to_s] = conv.(v) }
  when Array then x.map { |e| conv.(e) }
  when Symbol then ":#{x}"
  when Regexp then { '__rubyRegexp' => x.inspect }
  else x
  end
end
defaults = conv.(base)
# descriptions from comments
info = {}; block = []; section = ''
lines = File.readlines(base_path, chomp: true)
hash_banner = false # HASHBANNER
lines.each_with_index do |l, i|
  if l =~ /^\#{4,}\s*$/ then hash_banner = true; next end
  if hash_banner && l =~ /^#\s*(\S.*)$/ then section = $1.strip.sub(/\s*settings?\s*$/i, ''); hash_banner = false; block = []; next end
  hash_banner = false
  if l =~ /^#(.*)$/
    t = $1.strip
    next if t =~ /^-\s/ || t =~ /^[a-z_]+:(\s|$)/ || t =~ /^\s*$/
    block << t
  elsif l =~ /^([A-Za-z_][\w]*):/
    key = $1
    desc = block.reject { |b| b =~ %r{^https?://} }.join(' ')
    sec = block.map { |b| b[/^[#\s]*([A-Za-z][\w\/ ()-]{1,30}?)\s+settings?[\s#:]*$/i, 1] }.compact.reject { |x| x =~ /pattern hues/i }.first
    section = sec.strip if sec
    info[key] = [desc, section]
    block = []
  elsif l.strip.empty?
    # a blank line ends a comment block that was not directly above a key,
    # unless it is a section banner, which carries over
    sec = block.map { |b| b[/^[#\s]*([A-Za-z][\w\/ ()-]{1,30}?)\s+settings?[\s#:]*$/i, 1] }.compact.reject { |x| x =~ /pattern hues/i }.first
    section = sec.strip if sec
    block = []
  else
    block = []
  end
end
# base.yaml's skinning banner is followed by many combat keys
info.each { |k, v| v[1] = 'Combat' if v[1] == 'Skinning/dissect' && k !~ /skin|dissect|arrange|thanat|corpse|bundle|butcher/ }
town = YAML.unsafe_load_file(File.join(drs, 'data/base-town.yaml'))
towns = town.keys.sort.each_with_object({}) { |t, h| h[t] = { 'npc_empath' => !!town[t]['npc_empath'], 'locksmithing' => !!town[t]['locksmithing'] } }
pick = YAML.unsafe_load_file(File.join(drs, 'data/base-picking.yaml'))
costs = (pick['picking'] || pick)['lockpick_costs'] || pick['lockpick_costs']
costs = costs.transform_values { |v| v.is_a?(Hash) ? v.keys : v }
th_text = File.read(File.join(drs, 'data/base-theurgy.yaml'))
imm = {}; align = nil; ins = false
th_text.each_line do |l|
  if l =~ /^immortal_to_aspect:/ then ins = true; next end
  next unless ins
  break if l =~ /^[A-Za-z]/
  if l =~ /^\s*#\s*(Neutral|Dark|Light)\b/i then align = $1.capitalize; next end
  imm[$1.strip] = align if l =~ /^\s*["']?([A-Za-z' ]+?)["']?:\s*\S/
end
sp = YAML.unsafe_load_file(File.join(drs, 'data/base-spells.yaml'))
screams = sp['battle_cries'].select { |_, v| v['type'] == 'scream' }.keys.sort
craft = YAML.unsafe_load_file(File.join(drs, 'data/base-crafting.yaml'))
ctowns = %w[blacksmithing tailoring shaping carving remedies artificing].flat_map { |k| craft[k].keys }.uniq.select { |t| towns.key?(t) }
commit = `git -C #{drs} rev-parse --short HEAD`.strip
puts JSON.generate({ 'BASE_DEFAULTS' => defaults, 'BASE_KEY_INFO' => info, 'TOWNS' => towns, 'LOCKPICK_COSTS' => costs,
  'IMMORTALS' => imm, 'BARD_SCREAMS' => screams, 'CRAFTING_TOWNS' => ctowns.sort, 'DRS_COMMIT' => commit })

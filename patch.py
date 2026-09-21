import io

p = "src/components/studio/StudioExperience.tsx"
s = io.open(p, encoding="utf-8").read()

start = s.index("      {/* A very slight softening at the edges of the 360")
end = s.index("      {(phase === \"exploring\" || phase === \"transitioning\") && (\n        <>\n          {/* The site's own real nav")
block = s[start:end]
assert "backdropFilter" in block and len(block) < 2200, len(block)
s = s[:start] + s[end:]

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("backdropFilter left in file:", s.count("backdropFilter"))

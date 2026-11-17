// Ajusta palabras largas y conserva párrafos; también se usa para exportar a PNG.
export function wrapLines(text, measure, width) {
  const lines=[];
  for (const paragraph of String(text).split('\n')) {
    if (!paragraph.trim()) {lines.push('');continue;}
    let line='';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (measure(line ? `${line} ${word}` : word) <= width) {line = line ? `${line} ${word}` : word;continue;}
      if (line) {lines.push(line);line='';}
      for (const char of Array.from(word)) {
        if (line && measure(line+char)>width) {lines.push(line);line='';}
        line+=char;
      }
    }
    if(line)lines.push(line);
  }
  return lines;
}

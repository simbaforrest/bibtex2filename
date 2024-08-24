/**
 *  @file parseRIS.js
 *  @brief parse RIS format file and return data (same format as bibtex.js)
 *  @author Chen Feng <simbaforrest at gmail dot com>
 */
 
function parseRIS(entry) {
  var data={};
  var startPos = entry.search(/TY\s+-\s+/); //Cell uses 'TY - ' rather than the standard 'TY  - ', WTF!
  if (startPos<0) return false;
  var endPos = entry.search(/ER\s+-/);
  entry=entry.substring(startPos,endPos).trim();
  var pos=0;
  while(pos>=0) {
    var tag=entry.substr(0,2);
    var entry=entry.substr(entry.indexOf('-')+1);
    pos = entry.search(/[A-Z]{2}\s+-\s+|[A-Z][0-9]\s+-\s+/);
    var value='';
    if (pos<0)
      value=entry.trim();
    else {
      value=entry.substring(0,pos).trim();
      entry=entry.substr(pos);
    }
    switch (tag) {
    case 'AU': case 'A1': case 'A2': case 'A3': case 'A4': //author
      value=value.split(',');
      if (value.length<2) value[1]='';
      if (value.length<1) value[0]='';
      var author={last:value[0].trim(),first:value[1].trim()};
      if ('undefined' == typeof data['author']) data.author=[author];
      else data.author.push(author);
      break;
    case 'PY': case 'Y1': //year
      value=value.split('/');
      if (value.length<1) value[0]='';
      data.year=value[0];
      break;
    case 'TI': case 'T1': case 'T2': case 'T3': //title
      if ('undefined' == typeof data['title']) data.title=value.replace(/\s+/,' ');
      else data.title+='--'+value.replace(/\s+/,' ');
      break;
    case 'SP': //pages
      if ('undefined' == typeof data['pages']) data.pages=value+'-';
      else data.pages=value+'-'+data.pages;
      break;
    case 'EP': //pages
      if ('undefined' == typeof data['pages']) data.pages=value;
      else data.pages+=value;
      break;
    case 'JA': case 'JO': case 'J2': //journal
      data.journal=value.replace(/\s+/,' ');
      break;
    case 'PB': //publisher
      data.publisher=value;
      break;
    case 'VL': //volume
      data.volume=value;
      break;
    case 'IS': //issue
      data.issue=value;
      break;
    default:
      console.log('parseRIS: ignore line='+tag+'  - '+value);
    }
  }
  return data;
}
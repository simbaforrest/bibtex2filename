/**
 *  @file BibTex2FileName.js
 *  @brief Brief
 *  @author Chen Feng <simbaforrest at gmail dot com>
 *  Copyright (c) 2013 Chen Feng. All rights reserved.
 */

var bibtex = new BibTex({'unwrap':true});

function bibtexSafeGet(entryId,label) {
  if (bibtex.data[entryId].hasOwnProperty(label)) {
    return bibtex.data[entryId][label];
  }
  return '';
}

function getAuthor(varname) {
  var authors=bibtexSafeGet(0,'author');
  var authorPos=0;
  if (varname.length>1) {
    if (varname[1]=='n') {authorPos=authors.length-1;} //n: last author
    else authorPos=parseInt(varname.substr(1,varname.length-1),10);
    if (isNaN(authorPos)) {
     authorPos=0;
     console.log('BibTex2FileName error: getAuthor('+varname+')!');
    }
    if (authors.length<=authorPos || authorPos<0) authorPos=authors.length-1;
  }
  var author=authors[authorPos];

  switch (varname[0]) {
  case 'L': return author['last'];
  case 'F': return author['first'];
  case 'A': return author['last']+author['first'];
  case 'l': return author['last'][0];
  case 'f': return author['first'][0];
  case 'a': return author['last'][0]+author['first'][0];
  default: console.log('BibTex2FileName error: getAuthor('+varname+')!'); return '';
  }
}

//TODO: efficiency?
function getAbbr(value) {
  var rules = localStorage.rules;
  try {
    rules = JSON.parse(rules);
  } catch (e) {
    localStorage.rules = JSON.stringify([]);
  }
  for(var i=0; i<rules.length; i++) {
    var rule=rules[i];
    if ( (new RegExp(rule[0],rule[1])).test(value) ) return rule[2];
  }
  return value;
}

function getBibTex2FileNameVar(varname) {
  switch (varname[0]) {
  case 'L': case 'F': case 'A':
  case 'l': case 'f': case 'a':
    return getAuthor(varname).replace(/\s+/g, '');
  case 'T': return bibtexSafeGet(0,'title');
  case 'Y': return bibtexSafeGet(0,'year');
  case 'y':
    var year=bibtexSafeGet(0,'year');
    if (year.length>=2) return substr(year,0,-2);
    else return year;
  case 'V': return bibtexSafeGet(0,'volume');
  case 'I': return bibtexSafeGet(0,'issue');
  case 'P': return bibtexSafeGet(0,'pages');
  case 'B': return getAbbr(bibtexSafeGet(0,'booktitle'));
  case 'J': return getAbbr(bibtexSafeGet(0,'journal'));
  case 'U': return bibtexSafeGet(0,'publisher');
  case 'C': return bibtexSafeGet(0,'cite');
  case 'E': return bibtexSafeGet(0,'entryType');
  case 'e': return bibtexSafeGet(0,'entryType')[0];
  default: console.log('BibTex2FileName: ignore unknown variable $'+varname); return '';
  }
}

function BibTex2FileName(bibtexEntry, pattern) {
  bibtex.content=bibtexEntry;
  var retCode=bibtex.parse();
  bibtex.content='';

  if (bibtex.data.length>0 && retCode && !bibtex.isError(retCode)) {
    try {
      return {
        failed:false,
        fileName:bibtex2filenamePatternParser.parse(pattern)
      };
    } catch(e) {
      alert('BibTex2FileName fatal error: invalid pattern='+pattern+'\nerror=@line '+e.line+', column '+e.column+'\n'+e.toString());
      return {
        failed:true,
        fileName:'bibtex2filename pattern invalid!'
      };
    }
  } else { //try to parse as RIS
    bibtex.data=[parseRIS(bibtexEntry)];
	if (bibtex.data[0]!=false) {
	  try {
        return {
          failed:false,
          fileName:bibtex2filenamePatternParser.parse(pattern)
        };
      } catch(e) {
        alert('BibTex2FileName fatal error: invalid pattern='+pattern+'\nerror=@line '+e.line+', column '+e.column+'\n'+e.toString());
        return {
          failed:true,
          fileName:'bibtex2filename pattern invalid!'
        };
      }
	}
  }
  return {
    failed:true,
    fileName:'bibtex parsing failed!'
  };
}
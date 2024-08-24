/**
 *  @file background.js
 *  @brief create context menu and send selected text for converting and copying
 *  @author Chen Feng <simbaforrest at gmail dot com>
 *  Copyright (c) 2013 Chen Feng. All rights reserved.
 */

function copyToClipboard( text ){
  var copyDiv = document.createElement('div');
  copyDiv.contentEditable = true;
  document.body.appendChild(copyDiv);
  copyDiv.innerHTML = text;
  copyDiv.unselectable = "off";
  copyDiv.focus();
  document.execCommand('SelectAll');
  document.execCommand("copy");
  document.body.removeChild(copyDiv);
}

//adapt from: http://blog.venthur.de/index.php/2010/01/query-google-scholar-using-python/
function searchGoogleScholar( text ) {
  var query_url = "https://scholar.google.com/scholar?q="+encodeURI(text);
  var google_id = md5(Math.random()).substr(0, 16); //generate random google_id
  var XMLHTTP = new XMLHttpRequest();
  XMLHTTP.open("GET", query_url, false); //synchronous request
  XMLHTTP.setRequestHeader("Content-Type", "text/xml");
  XMLHTTP.send(null);
  if(XMLHTTP.responseText.length==0) {
      console.log("[searchGoogleScholar] "+query_url+" returned without responseText! (XMLHTTP.readyState="+XMLHTTP.readyState+")\n");
      return "";
  }
  
  var HTML = document.implementation.createHTMLDocument();
  HTML.body.innerHTML = XMLHTTP.responseText;
  var gs_ntas = HTML.querySelectorAll('div.gs_fl > a.gs_nta.gs_nph');
  if(gs_ntas.length>1) {
      console.log("found more than one paper, use the top one by default!");
  }
  var theItem = null;
  for(var i=0; i<gs_ntas.length; ++i) {
    if (gs_ntas.item(i).innerText.search("BibTeX")>=0) {
      theItem = gs_ntas.item(i).attributes.getNamedItem("href").nodeValue;
      break;
    }
  }
  if(theItem==null) {
      alert("[searchGoogleScholar] Make sure you enabled BibTex in: https://scholar.google.com/scholar_settings");
      return "";
  }
  
  var bibtex_url = theItem;
  console.log("[searchGoogleScholar] fetching: "+bibtex_url);
  XMLHTTP.open("GET", bibtex_url, false); //synchronous request
  XMLHTTP.setRequestHeader("Content-Type", "text/xml");
  XMLHTTP.send(null);
  if(XMLHTTP.responseText.length==0) {
      console.log("[searchGoogleScholar] "+bibtex_url+" returned without responseText! (XMLHTTP.readyState="+XMLHTTP.readyState+")\n");
      return "";
  }
  return XMLHTTP.responseText;
}

function legalFileName(input) {
    var SYMBOL_MAP = { //map normal ASCII symbol to their fullwidth version
        "/": "／", //forward slash in invalid in linux
        "<": "＜",
        ">": "＞",
        ":": "：",
        "\"": "＂",
        "\\": "＼",
        "|": "｜",
        "?": "？",
        "*": "＊"
    };
    return input.replace(/\/|<|>|:|"|\\|\||\?|\*/gi, function(matched){
      return SYMBOL_MAP[matched];
    }).replace(/\.\.+/g, ".").replace(/\s\s+/g," ");
}

function copyAndNotify(ret) {
    ret.fileName=legalFileName(ret.fileName);
    console.log("BibTex2FileName:\n"+ret.fileName);
    copyToClipboard(ret.fileName);
    localStorage.bibtex2filename=ret.fileName;
    chrome.notifications.clear('bibtex2filename.copied',function(wasCleared){});
    chrome.notifications.create('bibtex2filename.copied', {type:'basic', title:'BibTex2FileName =>Clipboard:', message:ret.fileName, iconUrl:'bibtex2filename128.png'}, function(notificationId){});
}

function convertAndCopy(bibtexEntry) {
  var ret=BibTex2FileName(bibtexEntry, localStorage['bibtex2filename::pattern']);
  if (!ret.failed) {
    copyAndNotify(ret);
    return;
  }
  //try google scholar
  bibtexEntry = searchGoogleScholar(bibtexEntry);
  ret=BibTex2FileName(bibtexEntry, localStorage['bibtex2filename::pattern']);
  if (!ret.failed) {
    copyAndNotify(ret);
    return;
  }
  //failed still
  {
    localStorage.bibtex2filename='';
    chrome.notifications.clear('bibtex2filename.copied',function(wasCleared){});
    chrome.notifications.create('bibtex2filename.copied', {type:'basic', title:'BibTex2FileName error:', message:ret.fileName, iconUrl:'bibtex2filename128fail.png'}, function(notificationId){});
  }
}

////////////
function bgInit() {
  //initialize pattern //TODO: use cookie to store the pattern permanently on client?
  var patternStorageName='bibtex2filename::pattern';
  var defaultPattern='$Y.$T.pdf';
  if (!localStorage.hasOwnProperty(patternStorageName)) {
    localStorage[patternStorageName]=defaultPattern;
  }
  //init control flag for .bib file download monitoring
  var monitorFlagStorageName='bibtex2filename::monitor';
  var TMPBIBNAME='bibtex2filename-tmp.html';
  if (!localStorage.hasOwnProperty(monitorFlagStorageName)) {
    localStorage[monitorFlagStorageName]=false;//default not to monitor
  }
  //add context menu
  chrome.contextMenus.create({
    "title": "Copy File Name From Selected BibTex Entry: %s",
    "contexts":["selection"],
    "onclick": function (info, tab) { convertAndCopy(info.selectionText); }
  });
  //add monitor for download .bib|.ris and .pdf file monitoring
  var downloadId=undefined;
  chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
    if (localStorage[monitorFlagStorageName]=='true' && /.*\.bib$|.*\.ris$/.test(item.filename)) {
      downloadId=item.id;
      var conflictAction='overwrite';
      suggest({filename: TMPBIBNAME,
               conflictAction: conflictAction,
               conflict_action: conflictAction});
      return;
    }
    if ('undefined' != typeof localStorage['bibtex2filename']
        && localStorage['bibtex2filename'].length>0
        && /.*\.pdf$/.test(item.filename))
    {
      var conflictAction='uniquify';
      suggest({filename: localStorage['bibtex2filename'],
               conflictAction: conflictAction,
               conflict_action: conflictAction});
      localStorage['bibtex2filename']='';
      return; 
    }
  });
  chrome.downloads.onChanged.addListener(function(delta) {
    if (localStorage[monitorFlagStorageName]=='true' && downloadId!=undefined && delta.id==downloadId) {
      if ('undefined' == typeof delta['state'] || delta.state.current != 'complete') return;
      console.log('opening newly download bibtex2filename-tmp.html');
      chrome.downloads.open(delta.id);
      downloadId=undefined;
    }
  });
  //receive content_script.js message and close bibtex2filename-tmp.html
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse){
    if (localStorage[monitorFlagStorageName]!='true') return;
    if (message.hasOwnProperty('bibtex2filename_tmp')) {
      convertAndCopy(message['bibtex2filename_tmp']);
      chrome.tabs.query({url:'file:///*/bibtex2filename-tmp.html'},function(tabs){
        for(var i=0; i<tabs.length; i++) {
          console.log('closing tab '+tabs[i].id);
          chrome.tabs.remove(tabs[i].id);
        }
      });
    } else {
      console.log('W: get message without bibtex2filename_tmp!');
    }
  });
}

bgInit();
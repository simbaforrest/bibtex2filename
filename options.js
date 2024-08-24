/**
 *  @file options.js
 *  @brief setting pattern string in localStorage to be used in background.js
 *  @author Chen Feng <simbaforrest at gmail dot com>
 *  Copyright (c) 2013 Chen Feng. All rights reserved.
 */

function load() {
  document.getElementById('version').innerText+=' v'+chrome.runtime.getManifest().version;
  chrome.extension.isAllowedFileSchemeAccess(function (allowed){
    if(!allowed) {
	  document.getElementById('fileAccessNote').style.color='red';
	  document.getElementById('fileAccessNote').innerHTML+='Note: to use this feature, you have to turn on the \'Allow access to file URLs\' for this extension in \'chrome://extensions/\'';
	} else {
	  document.getElementById('fileAccessNote').innerText='';
	}
  });
  var patternStorageName='bibtex2filename::pattern';
  var patternElement = document.getElementById('pattern');
  var defaultButton = document.getElementById('defaultPattern');
  var setButton = document.getElementById('setPattern');
  var monitorOrNotBox = document.getElementById('monitorOrNot');
  var defaultPattern='[$Y|0000][.$B|.$J].$L$f.[$T|TTT].pdf';
  if (!localStorage.hasOwnProperty(patternStorageName)) {
    localStorage[patternStorageName]=defaultPattern;
    patternElement.value=defaultPattern;
  } else {
    patternElement.value=localStorage[patternStorageName];
  }
  
  defaultButton.addEventListener('click', function(evt) {
    localStorage[patternStorageName]=defaultPattern;
    patternElement.value = defaultPattern;
  }, false);
  
  setButton.addEventListener('click', function(evt) {
    localStorage[patternStorageName]=patternElement.value;
  }, false);
  
  var monitorFlagStorageName='bibtex2filename::monitor';
  if (!localStorage.hasOwnProperty(monitorFlagStorageName)) {
    localStorage[monitorFlagStorageName]=false;//default not to monitor
    monitorOrNotBox.checked=false;
  } else {
    monitorOrNotBox.checked=(localStorage[monitorFlagStorageName]=='true');
  }
  
  monitorOrNotBox.addEventListener('click', function(evt) {
    localStorage[monitorFlagStorageName]=monitorOrNotBox.checked;
  }, false);
}

document.addEventListener('DOMContentLoaded', load);

function loadRules() {
  var abbrRules = document.getElementById('abbrRules');
  if (!localStorage.hasOwnProperty('rules')) {
    storeRules();//init
    return;
  }
  var rules;
  try {
    rules=JSON.parse(localStorage.rules);
  } catch(e) {
    rules=[];
    localStorage.rules=[];
    return;
  }
  abbrRules.value='';
  for (var i=0; i<rules.length; i++) {
    var rule = rules[i];
    if (rule.length!=3) continue;
    abbrRules.value+=rule[0]+' ->'+(rule[1]==='i'?'i ':' ')+rule[2]+'\n';
  }
}

function storeRules() {
  var rawText = document.getElementById('abbrRules').value;
  var rawRules = rawText.split(/\n/);
  var rules = [];
  for (var i=0; i<rawRules.length; i++) {
    var line = rawRules[i];
    if (line.length<=0 || line[0]=='#') continue;
    var pos=line.lastIndexOf('->');
    var ruleIf=line.substring(0,pos).trim();
    if (ruleIf.length<=0) {
      console.log('BibTex2FileName warn: ignore invalid rule='+line);
      continue;
    }
    var caseInsensitive='', ruleThen='';
    if (pos+2<line.length && line[pos+2]=='i') {
      caseInsensitive='i';
      ruleThen = line.substring(pos+3,line.length).trim();
    } else {
      ruleThen = line.substring(pos+2,line.length).trim();
    }
    rules.push([ruleIf,caseInsensitive,ruleThen]);
  }
  try {
    localStorage.rules=JSON.stringify(rules);
  } catch(e) {
    localStorage.rules=[];
  }
}

window.onload = function() {
  loadRules();
  document.getElementById('setRule').addEventListener('click', function(evt) {
    storeRules();
  }, false);
}
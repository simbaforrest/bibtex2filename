/**
 *  @file content_script.js
 *  @brief Brief
 *  @author Chen Feng <simbaforrest at gmail dot com>
 *  Copyright (c) 2013 Chen Feng. All rights reserved.
 */

chrome.runtime.sendMessage({bibtex2filename_tmp: document.body.innerText});
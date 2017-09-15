# Search-And-Replace
RegEx Search &amp; Replace Extension for Chrome and Firefox browsers

## Project Specification

### Principal Goal

Develop a Chrome/Firefox browser plug-in to allow Search & Replace with regular expressions in text input fields of web pages.  

### Description

The project will develop a Chrome browser plug-in that would provide a search & replace functionality in text input fields of web pages. An important part of the project is to provide support for the use of popular regular expression constructs, a functionality which is missing in extensions available today. Other desirable features include:

- Ability to restrict search & replace to the current input field (i.e. where the cursor is) or run through all input fields on the page.
- Restrict search & replace to the selected text only
- Support for templates (i.e. a small "library" of commonly occurring patterns to search-and-replace with one click).

In addition to the software development work, it is expected that the student will do at least one round (ideally two) of user testing, collecting the feedback, and improving the tool based on the responses & bug reports. An ideal way to do this is by having a stable beta version of the plugin available on the Chrome Web Store well before the thesis is due. 


## Motivation ~ Why would this be useful?

- Weird Characters In Blog Entries – This sometimes happens in WordPress immediately after an upgrade. You may end with weird characters such as “â€”, “â€™” or “??”. Imagine the agony of having to replace each occurrence manually.
- Renaming A Word – Sometimes you may want to rename a word that occurs several times in an entire blog post, forum post or email. For example, you could decide to use a synonym which sounds better or brings out the meaning more clearly.
- Fixing A Typo – You may also realize that you have been spelling a word the wrong way and it happens to reoccur several times in your blog post, forum post or email.

Search and replace would be extremely useful on these websites: WordPress, Gmail, Hotmail, Blogger, Facebook, any forums, online blogging platforms, and web email clients.

You could always paste the content into your word processor, fix it and paste it back into the Chrome input field but that is a lengthy and time consuming process.


## What already exists?

Web browsers support standard search functionality for any text on a page but no browsers have the search & replace functionality (Google Chrome Help Forum post asking for the feature: https://productforums.google.com/forum/#!topic/chrome/Y4UORlpdYfo)

There have been several attempts to implement this functionality via an extension. Most of them either don't work, are missing functionality (particularly regex), are limited to certain websites, or are unintuitive and hard to use in general. 

### Chrome
- https://chrome.google.com/webstore/detail/search-and-replace/bldchfkhmnkoimaciljpilanilmbnofo?hl=en-GB (doesn't work in many places such as Blogger, Facebook, and has many other issues) 
- https://chrome.google.com/webstore/detail/find-replace/cfjmfciolkikfodjfdmdpdmpfbjdofek?hl=en (requires copy-pasting your desired text)
- https://chrome.google.com/webstore/detail/findr/bidnaaogcagbdidehabnjfedabckhdgc (replaces raw HTML - different, undesirable functionality)
- https://chrome.google.com/webstore/detail/easy-replace/ojoeejfegihohnkjlfoonbnailkohkce (not working on most websites)

### Firefox
- https://addons.mozilla.org/en-US/firefox/addon/find-and-replace-for-firefox (not working for most users, and no regex)
- https://addons.mozilla.org/en-US/firefox/addon/foxreplace/ (permanent webpage text substitution - different functionality)

### Other browsers
Approximate values for current market share for desktop are (https://en.wikipedia.org/wiki/Usage_share_of_web_browsers): Chrome 55%, Safari 15%, Firefox 10%, Edge < 5%

This project will focus on Chrome and Firefox, which mostly follow the same Extension API. Safari, although widely used, has its own extension API and is in general more involved as it requires dealing with Apple's developer libraries and licenses.

## Development

### API Design
There should be an extension background page with a content script that is programmatically injected into the page whenever the user triggers 'search & replace'.

TODO: Explain the reasoning behind this and how extensions work in general (https://developer.chrome.com/extensions).

TODO: Explain security scopes, Chrome API being available from the background page, page content being accessible only from via content scripts. 

TODO: Define message passing API between the background page and content scripts.

TODO: Explain permissions set in manifest and motivation behind the `activeTab` permission https://developer.chrome.com/extensions/activeTab#motivation

### Search and Replace UI Components
- 'Find' input field
- 'Replace' input field
- Action buttons (see below)
- Options (see below)
- 'X of Y' or 'No Results' indicator
- Regex groups indicator (for regex search only)
- Common Substitution Templates

#### Action Buttons
- Replace (~ pressing ENTER in 'Replace' field)
- Replace All
- Find (~ pressing ENTER in 'Find' field) OR Next match (+ Previous match)
- Close

#### Options
- Match Case (Aa)
- Use Regex (.*)
- Whole Word (Ab|)
- In Text Selection
- In Current Input Field

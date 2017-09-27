# Find & Replace Extension for Text Editing
RegEx Search & Replace Extension for Chrome and Firefox browsers.

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

Web browsers support standard search functionality for any text on a page but no browsers have the find & replace functionality (Google Chrome Help Forum post asking for the feature: https://productforums.google.com/forum/#!topic/chrome/Y4UORlpdYfo)

*Google Chrome browser:*

![chrome-find](docs/browser-find-toolbar/chrome-find.png)

*Mozilla Firefox browser:*

![firefox-find](docs/browser-find-toolbar/firefox-find.png)

There have been several attempts to implement this functionality via an extension. Most of them either don't work, are missing functionality (particularly regex), are limited to certain websites, or are unintuitive and hard to use in general. 

### Chrome
- https://chrome.google.com/webstore/detail/search-and-replace/bldchfkhmnkoimaciljpilanilmbnofo?hl=en-GB (doesn't work in many places such as Blogger, Facebook, and has many other issues) 
- https://chrome.google.com/webstore/detail/find-replace/cfjmfciolkikfodjfdmdpdmpfbjdofek?hl=en (requires copy-pasting your desired text)
- https://chrome.google.com/webstore/detail/findr/bidnaaogcagbdidehabnjfedabckhdgc (replaces raw HTML - different, undesirable functionality, and requires excessive permissions)
- https://chrome.google.com/webstore/detail/easy-replace/ojoeejfegihohnkjlfoonbnailkohkce (not working on most websites)

### Firefox
- https://addons.mozilla.org/en-US/firefox/addon/find-and-replace-for-firefox (not working for most users, and no regex)
- https://addons.mozilla.org/en-US/firefox/addon/foxreplace/ (permanent webpage text substitution - different functionality)

### Other browsers
Approximate values for current market share for desktop are (https://en.wikipedia.org/wiki/Usage_share_of_web_browsers): Chrome 55%, Safari 15%, Firefox 10%, Edge < 5%

This project will focus on Chrome and Firefox, which mostly follow the same Extension API. Safari, although widely used, has its own extension API and is in general more involved as it requires dealing with Apple's developer libraries and licenses.

## Development

### Naming and SEO
Based on the research mentioned above, these extension names already exist: 'Easy Replace', 'Search and Replace', 'FindR', 'Find Replace', 'FoxReplace'. Using any of these existing names would be bad for SEO and discoverability. At the same time, we want to clearly indicate that the extension is used for input fields and editable content rather than HTML source code.

People are likely to search for browser extensions by typing in the functionality that they need. In our case, that might look something like 'find and replace in text input fields extension'. Stating the extensions purpose in its title and description should help us do better in search results. I therefore avoided any newly-invented words and named it **Find & Replace for Text Editing**. We are not trying to trademark a new brand name, we are simply trying to match what people might search for.

### Search and Replace UI Components
- 'Find' input field
- 'Replace' input field
- **Action buttons** (see below)
  - Replace (~ pressing ENTER in 'Replace' field)
  - Replace All
  - Find next (~ pressing ENTER in 'Find' field)
  - Find previous
  - Close
- **Options** (see below)
  - Match Case (Aa)
  - Use Regex (.*)
  - Whole Word (Ab|)
  - In Text Selection
  - In Current Input Field
- 'X of Y' or 'No Results' indicator
- Regex groups indicator (for regex search only)
- Common Substitution Templates

In general we would like to follow the current standard of find & replace toolbars. Many of these can be seen in more advanced text editors:

*Android Studio:*

![Android Studio](docs/editor-find-and-replace/android-studio-find-and-replace.png)

*Google Docs:*

![Google Docs](docs/editor-find-and-replace/gdocs-find-and-replace.png)

*Visual Studio Code:*

![Visual Studio Code](docs/editor-find-and-replace/vscode-find-and-replace.png)

*Sublime Text 3:*

![Sublime Text 3](docs/editor-find-and-replace/sublime-find-and-replace.png)


At the same time, we should not assume that regular users are familiar with regular expression or more advanced search functions. Therefore, the UI design of some of these editor widgets should only be used as an inspiration - regular users are not developers and the number of options in this extension must not feel overwhelming. 

### Accessibility

#### Keyboard
Launch the toolbar: `Ctrl+Shift+F` (`Command+Shift+F` on Mac)
Note that all `Ctrl+F`, `Ctrl+R`, and `Ctrl+Shift+R` are already predefined browser shortcuts, so we cannot use those.

Once the search widget appears:
  - Next match: `F3` or `Enter` in 'Find' input field
  - Previous match: `Shift+F3`
  - Replace: `Enter` in 'Replace' input field
  - Replace All: `Ctrl+Shift+A`

#### Context Menu
User can select text on the page and, after right-clicking the selection, search for the text using the extension. This should open the extension search widget and/or replace the current 'Find' input field with the selected text.

UPDATE: The background page cannot open the pop-up(https://stackoverflow.com/questions/5544256/chrome-extensionhow-to-pragmatically-open-the-popup-window-from-background-htm). It cannot be opened programmatically - the user must click on the browser action to open it. But we can inject a content script that creates a floating div mimicking our search widget.

### Common Substitution Templates
We might want to have a small library of commonly occurring patterns that users could quickly find and replace.  
Ideas for templates include:
  - Email address: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
  - URL
  - Integer: /^-?\d+$/
  - Any number: /^[+-]?\d*\.?\d+$/
  - Excess whitespace at the beginning or end of a line: /^[ \t]+|[ \t]+$/
  - No capital letter at the start of a sentence: /(^|\. )\w/
  - More than one space after a period: /(?<=\.) {2,}(?=[A-Z])/
  - Wordpress shortcode: /^\[([a-z-_0-9]+)([^\[]+)*(?:\](.*)\[\/\1\]|\s+\/\])$/

### Scope of Search

#### `<input type="text">`
For a short single line of text, HTML `<input>` element is often used. However, due to the short length, this will mostly not be a common target of find & replace. Still, it should be included for consistency.

There are other types of input fields (many new were added with HTML5), such as date, email, number, tel, time, and similar, but text is the standard one.  
https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text

#### `<textarea></textarea>`
Multi-line plain-text input space. This should be a common target for find & replace. It is used by many sites to allow users compose longer pieces of text, one of them is new post creation on Reddit.  
https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea

#### `<div contenteditable="true"></div>`
Enabling rich text formatting by allowing HTML tags inside the text area, `contenteditable` elements are used in Gmail, Facebook posts, Facebook Messenger, GitHub editor, Twitter, and many other sites. Note that `contenteditable` is a global attribute and is therefore not limited to `div` tags.  
https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable

#### `contenteditable` tag inside an `<iframe></iframe>`
Blogger.com is an example of a site that isolates the main contenteditable area in an iframe. When performing find & replace we must consider the scenario where we're dealing with elements inside an `<iframe>` on the page. 

#### Other DOM
This extension isn't meant to modify (find & replace) the raw HTML text of the page's source. It is limited to finding occurrences in text areas that are modifiable by users.  
There are certainly sites that might try to avoid all the options discussed above and implement their own text editor functionality. One noteable example is Google Docs, which is using static DOM but listen to user's keyboard events to modify it internally in JavaScript. Implementing your own online text editor from scratch without using contenteditable or textareas involves a lot of work, and such editor should probably include its own find & replace functionality, which is what Google Docs do.

At this point, it seems reasonable to limit the implementation to only cover the choices discussed above and wait for the user feedback to see if there are any widely-used sites containing their own implementation of text input areas.

### User Interface for Search Widget

#### UI Design
TODO: Explain that extensions use a pop-up widget with browserAction icon

We split the UI layout to two types - simple and advanced. Because displaying all search options in one widget might feel overwhelming for regular users, there should be a way of switching the search UI to the 'advanced' state that would include regex options and helpful previews of matched regex groups etc.

TODO: explain disabling buttons to draw attention to the active input field elements 

##### Why not Material Design
For the general look and feel, I decided not to use Google's increasingly popular [Material Design](https://material.io/) for several reasons. First, Material Design works well when there's a lot of space and all the elements can be spread out. Unfortunately, this extension's user interface is a small widget with very limited space and many condensed compononets.

Secondly, Material Design likes to add its *ripple effect* to most interactions (such as clicking a button). I believe this looks great for actions that have large impact (e.g. navigating to a new page, or submitting a form), but for our purposes we need something less flashy, as most buttons are going to be pressed very often (Find prev/next, and Replace button) and too many effects or animations would cause too much distraction for the user.

I believe that, to a large extent, an extension (the pop-up) should feel like it is part of the browser by perhaps matching some of the UI styles. We don't want to create an extension that gives users the feeling that it completely doesn't belong because of its wild user interface and styles.

#### UI Implementation
To implement the search UI widget, we could simply create DOM for all the input components and listen to any changes as the user interacts with the UI. Unfortunately, all input components manage their own state - a better approach would be to have the search parameters state in one central place/datastore and have the UI inputs reflect this data. Therefore, we are going to use the React.js library to implement the search UI.

React has become popular in recent years - one reason is that it enforces this pattern of always reflecting the current application state in the UI. Without it, we would have to manage all the inputs separately and this could create many UI inconsistencies - incorrect update of our internal data might create a state of the application where our search parameters are set to certain values internally but display different state externally via our UI. As we're dealing with a lot of different inputs (many search parameters as well as the simple and advanced modes of the search layout), using React seems to be a wise choice.

TODO: explain React input handling (https://facebook.github.io/react/docs/forms.html) and technologies used (https://facebook.github.io/react/docs/installation.html) and my search-widget project setup + tech stack in general  
TODO: mention [component separation for easier development](./search-widget/README.md)


### API Design
There should be an extension background page with a content script that is programmatically injected into the page whenever the user triggers 'find & replace'.

TODO: Explain the reasoning behind this and how extensions work in general (https://developer.chrome.com/extensions).

TODO: Explain security scopes, Chrome API being available from the background page, page content being accessible only from content scripts. 

TODO: Explain permissions set in manifest and motivation behind the `activeTab` permission https://developer.chrome.com/extensions/activeTab#motivation  (we are not requesting chrome.tabs permission)


#### Component Lifecycle
Our background page is only a single JavaScript file that sets up all required events and starts listening to incoming message connections. Whenever the extension icon is clicked (or the launch keyboard shortcut pressed), our UI widget pops up. The widget can be closed/destroyed by the user anytime, so it first registers itself with our background page, so that the background page can see when the message port disconnects (when the widget is closed). 

The widget needs to communicate with the content script to manage highlighting in the page. Right after the widget connects to the background page, the background page checks if the content scripts have been injected already (the widget may have been previously closed and reopened). If they have not been injected yet, it injects them. If, on the other hand, they have been injected previously, it simply sends a message to the content script to reconnect (restart its port connection). 

Once content scripts are injected, they broadcast a port connection - both the background page and UI widget are listening for this event. Background page needs to connect to the content script to see when the message port disconnects (user may have navigated to a different page and we thus lost the injected code). Search widget needs the content script connection for all its API actions - this is going to be the most frequent message passing channel.

##### Why is the lifecycle complicated
We are managing three separate component - the search widget, the background page, and the context of the webpage itself (via content scripts). None of these components are permanent - The search widget can be destroyed/closed anytime. The content scripts in the page are lost whenever the user navigates to a different website. And finally the background page isn't persistent either - it simply sets up a bunch of event listeners that can wake it up in the future, and shuts itself down.

Could we do everything in the content scripts? Content scripts run in the content of the webpage and for security reasons they don't have access to the Chrome APIs - for a large portion of the extension functionality, and for the search widget integration, we need the background page.

##### Storing State
TODO:  
In Widget - Search params, all inputs;  
In Content Script: Refs to all DOM textarea elements, Find-next number (because it keeps dynamically changing and search widget should only receive it from content script messages passed to it)
In Background: Nothing - here we just set up events

#### User actions
- Update search query or options
  - 'Find' input field content changes
  - One of the search options is toggled
- Find next/previous
- Replace current/all
- Close the widget

#### Actions API
User actions specified above directly translate to types of messages that need to be passed between our widget and the content scripts in the page. We define the following API, where each message has the prototype `{ action: string, data: Object }` where `data` is optional:

**action: shutdown**
- Clean up all active highlights when widget is closed

**action: restart**
- Trigger port reconnect action, on widget re-open

**action: log**
- Logs `data`

**action: updateSearch**
- Uses `data` to update search parameters

**action: findNext**
- Finds next match

**action: findPrev**
- Find previous match

**action: replaceCurrent**
- Replaces current match with `data`

**action: replaceAll**
- Replaces all matches with `data`

#### Highlighting Found Matches
Highlighting `contenteditable` element should not be a problem - we can simply inject our own `span` element with our custom class into the element's DOM. Contenteditable elements are designed to contain any HTML nodes so no problem here.

Highlighting `<input>` and `<textarea>` is more tricky because they both only allow plain text to be displayed inside them. Any styled markup will not render as expected. To overcome this, one must create an overlay that exactly matches the input or textarea element and then highlight text in this new element. Further, there are many browser-specific quirks and one must also take care of synchronizing scrolling and handling textareas that are resizable by the user. In other words, it is a lot of work.  
http://codersblock.com/blog/highlight-text-inside-a-textarea/

Fortunately, there have been a few attempts to implement this. The most successful version I found was the following jQuery plugin: https://github.com/lonekorean/highlight-within-textarea/ becase it also supports resizable textareas (other plugins I found did not).  
Even though this plugin does better than all the other plugins that exist, it still has many issues, particularly when it comes to transferring all necessary CSS styles. When I was testing it, it failed to properly align highlighting for several textareas with particular styling. Therefore, I contributed to the development of this open-source plugin by fixing all the bugs I found and creating a pull-request on GitHub.  
https://github.com/lonekorean/highlight-within-textarea/pull/19
  - Submitted: Sep 24
  - Reviewed by the author: Sep 25
  - Review comments addressed: Sep 25
  - Currently waiting for 2nd Review (as of Sep 26).

For highlighting text in `contenteditable` elements I'm going to use https://markjs.io/ - TODO
TODO: maybe I don't need this and can implement a lightweight highlighter myself

### Testing

### Distribution & Marketing

### Feedback & Iteration


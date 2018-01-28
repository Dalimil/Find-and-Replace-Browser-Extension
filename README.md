# Find & Replace Extension for Text Editing
RegEx Search & Replace Extension for Chrome and Firefox browsers.

**Project Website:** https://find-and-replace-f6588.firebaseapp.com/

**Chrome Web Store Link:** https://chrome.google.com/webstore/detail/find-replace-for-text-edi/jajhdmnpiocpbpnlpejbgmpijgmoknnl

**Firefox Add-ons Store Link:** https://addons.mozilla.org/en-US/firefox/addon/find-replace-for-text-editing/

**Dissertation Report (Project Documentation):** [dissertation/dissertation.pdf](dissertation/dissertation.pdf)

![Find & Replace Browser Extension - Web Store Screenshot A](graphics/web-store/Search-and-Replace-Web-Store-A.jpg)

![Find & Replace Browser Extension - Web Store Screenshot B](graphics/web-store/Search-and-Replace-Web-Store-B.jpg)


## Project Specification (TODO -> convert to dissertation report)

### Component Overview

##### Maintaining state across the extension components
TODO: Explain chrome.storage https://developer.chrome.com/extensions/storage and describe challenges faced when syncing state within the app - abstracting with Promises and chaining async operations once finished + observer pattern - subscribing to updates when another part of the app changes storage

### Content Script RegEx Search
JavaScript contains native support for regular expressions (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions). Without using any additional libraries, we can simply create new RegExp objects and execute search methods on regular strings to find matches for the given regular expression query.

When choosing the string that we want to search in, we need to only consider the text content in our HTML nodes - finding matches in `innerHTML` would be a mistake since we need to ignore the website's source markup and only consider the text that users see.  

Instead of searching for a one text occurrence at a time, we want to match the behaviour of modern text editors and show the user all matches at once using text highlighting. We therefore only perform the search once (meaning everytime search parameters change), because later actions (find next/prev, replace one/all) will simply work with the text occurrences we already found. 

#### Handling iframes
TODO: explain recursive search for active element

TODO: explain the concept of my Context object - performing all dom operations (in particular jQuery functions) with respect to a specific Window and Document objects (such as window.getActiveSelection, window.scroll etc.)

#### Highlighting Found Matches

##### Highlighting in `contenteditable`
Highlighting inside a `contenteditable` element should not be a problem - we can simply inject our own `span` element with our custom class into the element's DOM. Contenteditable elements are designed to contain any HTML nodes so no problem here.

For the highlighting, I'm going to use the [mark.js](https://markjs.io/) plugin. We could certainly implement the highlighting ourselves (wrapping each search occurrence in `<span>` elements with custom styling), but there are many tricky cases that we need to handle. For instance, HTML `<div>John <b>Smith</b></div>` matches the query `John S` but simply inserting a `<span>` at the start and end would violate HTML rules, and instead we'd need to create two pairs of `<span>` elements - for `John ` and another for `S` inside the `<b>` tags.

There are more tricky cases like this. Therefore, it's wiser not trying to reinvent the wheel and instead use a plugin that is actively maintained and used by many people.

##### Highlighting in `<textarea>`
Highlighting text in `<textarea>` is more tricky because it only allows plain text to be displayed inside it. Any styled markup will not render as expected. To overcome this, one must create an overlay that exactly matches the textarea element and then highlight text in this new element. Further, there are many browser-specific quirks and one must also take care of synchronizing scrolling and handling textareas that are resizable by the user. In other words, it is a lot of work.  
http://codersblock.com/blog/highlight-text-inside-a-textarea/

Fortunately, there have been a few attempts to implement this. The most successful version I found was the following jQuery plugin: https://github.com/lonekorean/highlight-within-textarea/ becase it also supports resizable textareas (other plugins I found did not).  
Even though this plugin does better than all the other plugins that exist, it still has many issues, particularly when it comes to transferring all necessary CSS styles. When I was testing it, it failed to properly align text for several textareas with particular styling. Therefore, I contributed to the development of this open-source plugin by fixing all the bugs I found and creating a pull-request on GitHub.  
https://github.com/lonekorean/highlight-within-textarea/pull/19
  - Submitted: Sep 24
  - Reviewed by the author: Sep 25
  - Review comments addressed: Sep 25
  - After 2nd review the discussion still continues, there are backward-compatibility issues and conflicting views on the design and purpose of the plugin. As I'm injecting the code dynamically I have a slightly different use case and might need to leave my forked version unmerged.

For highlighting text in the `<div>` mirroring our textarea, I'll use **mark.js** again. This is mostly for making things consistent and having a single unified function interface (finding and replacing the plaintext separately would also be an option, but we are using the library already so there's no need to make things more complicated).

##### Extending scope to include `<input>` elements
Why? A lot of people are complaining about the extension not working for single-line text inputs. The argument for not implementing it for `<input>` elements was that these are only very short pieces of text (typically a few words but typically less than 100 characters).

It turns out that the scenario that users face is this: Given a very large number of single line text inputs in a single page, they need to search and replace a phrase across all of them at once.

The input types that contain standard text and would therefore be a good target of our extension are the following: `<input>`, `<input type="text">`, `<input type="search">`, `<input type="url">`, `<input type="email">`. So we are going to find these using the following CSS selector: 
`input:not([type]), input[type="text"], input[type="search"], input[type="url"], input[type="email"]`

The problem is that there might potentially be a large number of these input fields in a single webpage - websites have plenty of search bars or input fields scattered around, often away from the main content - so if this functionality is implemented it should only be added as a switchable option, most likely in the existing advanced options in the search widget.

To implement this whole thing, we can reuse some of the code for mirroring and overlaying textareas, some of the styling will be different, because the input is vertically centered by default, and instead of the text wrapping to the next line, it instead continues as a single line.

The horizontal scroll itself is somewhat problematic - Firefox fires the scroll event for us and when user scrolls the input box, it preserves the scroll position after the element is defocused. We can therefore capture the scroll event and shift our overlay highlighting by the same scroll amount.

Chrome on the other hand doesn't fire the scroll event for us, but since it automatically resets the scroll position to zero after the element is defocused the initial highlighting will always be correctly aligned. The only issue arises when the user tries to horizontally scroll the input box with the extension search widget open, because the highlights will not move. This can only be done with a touchpad however, as clicking into the page would dismiss the search widget. Since single line inputs with a large text overflow are quite uncommon in the first place, we ignore this specific case, as it presents only a slight visual flaw, that will most likely not occur.

#### RegExp Replace
In the replace input string, user can specify special symbols to refer to the found occurrence.

- `$n` - Where n is a positive integer, inserts the n-th parenthesized submatch string.
- `$0` or `$&` - Inserts the matched substring.

These are commonly used to extend find & replace functionality in advanced text editors. Inspiratio also taken from Mozilla's spec on MDN website: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter

### Feedback & Iteration

#### Changelog (releases)
- v1.3.9 - 14th Jan - Support local debug mode for testing
- v1.3.8 - 14th Jan - Fix 'No Target' indicator
- v1.3.7 - 13th Jan - Add Google Docs warning notification
- v1.3.6 - 2nd Jan - Add support for single-line input fields
- v1.3.5 - 31st Dec - Add hostname to GA for domain analysis
- v1.3.4 - 19th Dec - Fix 'Replace all' with regex groups
- v1.3.3 - 19th Dec - Fix restored favorites not storing state
- v1.3.2 - 18th Dec - Fix undefined regexp groups substitution
- v1.3.1 - 27th Nov - Add info notification for broken sites
- v1.3.0 - 27th Nov - Implement dynamic mark tags based on site
- v1.2.1 - 18th Nov - Add more events to GAnalytics
- v1.2.0 - 18th Nov - Change templates to execCommand API
- v1.1.3 - 25th Oct - Fix bugs in replace offsets
- v1.1.2 - 23th Oct - Add help text links
- v1.1.1 - 23th Oct - Add UI hints
- v1.1 - 20th Oct - Disable all debug logs
- v1.0 - 18th Oct - First prototype released
- v0.1 - 13th Sep - Raw dev work started

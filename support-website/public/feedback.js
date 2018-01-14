
let submissionInProgress = false;

function submitFeedback($textarea, $button, urlEndpoint) {
  $button.click((e) => {
    e.preventDefault();

    const feedback = $textarea.val();
    if (feedback.length < 20) {
      // Feedback is too short - probably not useful
      spawnWarningMessage('Could you please be more specific?');
      return false;
    }
    if (submissionInProgress) {
      return false;
    }
    // Everything OK, submit
    submissionInProgress = true;
    $button.text('Sending...').css({ backgroundColor: '#888', cursor: 'default', opacity: 0.8 });
    fetch(urlEndpoint, {
      method: 'POST',
      body: JSON.stringify({ feedback })
    }).then(response => {
      $button.text('Sent!').css({ backgroundColor: '#3b7', opacity: 0.7 });
      $textarea.val("").css({ height: '0' }).prop('disabled', true);
    });
    return false;
  });
}

/* jQuery notification plugin OhSnap: 
 * https://www.jqueryscript.net/other/Lightweight-jQuery-Notification-Plugin-ohSnap.html */
window.ohSnap = function(n,t){var o={color:null,icon:null,duration:"5000","container-id":"ohsnap","fade-duration":"fast"};t="object"==typeof t?$.extend(o,t):o;var a=$("#"+t["container-id"]),e="",i="";t.icon&&(e="<span class='"+t.icon+"'></span> "),t.color&&(i="alert-"+t.color),html=$('<div class="alert '+i+'">'+e+n+"</div>").fadeIn(t["fade-duration"]),a.append(html),html.on("click",function(){window.ohSnapX($(this))}),setTimeout(function(){window.ohSnapX()},t.duration)};
window.ohSnapX = function(n,t){defaultOptions={duration:"fast"},t="object"==typeof t?$.extend(defaultOptions,t):defaultOptions,"undefined"!=typeof n?n.fadeOut(t.duration,function(){$(this).remove()}):$(".alert").fadeOut(t.duration,function(){$(this).remove()})};

function spawnWarningMessage(text) {
  const containerId = "ohsnap-notification";
  if (!$(`#${containerId}`).length) {
    const msgContainer = document.createElement('div');
    msgContainer.id = containerId;
    msgContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      margin-left: 10px;
      z-index: 99999;
    `;
    document.body.appendChild(msgContainer);
  }
  window.ohSnap(text, { 'container-id': containerId });
}

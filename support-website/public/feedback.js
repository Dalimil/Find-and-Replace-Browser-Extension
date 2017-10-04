
let submissionInProgress = false;

function submitFeedback($textarea, $button, urlEndpoint) {
  $button.click((e) => {
    e.preventDefault();
    if (submissionInProgress) return;
    submissionInProgress = true;

    const feedback = $textarea.val();
    if (feedback.length > 0) {
      $button.text('Sending...').css({ backgroundColor: '#888', cursor: 'default', opacity: 0.8 });
      fetch(urlEndpoint, {
        method: 'POST',
        body: JSON.stringify({ feedback })
      }).then(response => {
        $button.text('Sent!').css({ backgroundColor: '#3b7', opacity: 0.7 });
        $textarea.val("").css({ height: '0' }).prop('disabled', true);
      });
    }
    return false;
  });
}

(() => {
  const
    step = 1,
    updateTimeoutMs = 120,
    textElement = document.querySelector('#text'),
    texts = ['Hello World.', '<Input error here>', 'Made with love.'],
    colors = ['tomato', 'rebeccapurple', 'lightblue'],

    getTextAndColor = (function* getTextAndColor() {
      for (let i = 1; ;i++) yield [texts[i % texts.length], colors[i % colors.length]];
    })();

  (function updateText(currentText = texts[0], currentColor = colors[0], isAdding = true) {
    if (textElement.style.color != currentColor) textElement.style.color = currentColor;

    if (isAdding) {
      textElement.textContent = currentText.slice(0, textElement.textContent.length + step);
      if (textElement.textContent.length >= currentText.length) return setTimeout(() => updateText(currentText, currentColor, false), 1000);
    }
    else {
      textElement.textContent = textElement.textContent.slice(0, -step);
      if (textElement.textContent.length <= 0) return setTimeout(() => updateText(...getTextAndColor.next().value, true), 1000);
    }

    return setTimeout(() => updateText(currentText, currentColor, isAdding), updateTimeoutMs);
  })();
})();
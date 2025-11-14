const
  step = 1,
  msInSecond = 1000,
  updateTimeoutMs = 120,
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  textElement = document.querySelector<HTMLSpanElement>('#text')!,
  texts = ['Hello World.', '<Input error here>', 'Made with love.'] as const,
  colors = ['tomato', 'rebeccapurple', 'lightblue'] as const,

  getTextAndColor = (function* getTextAndColor(): Generator<[string, string | undefined], never, [string, string | undefined]> {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    for (let i = 1; ;i++) yield [texts[i % texts.length]!, colors[i % colors.length]];
  })();

(function updateText(currentText: string | undefined = texts[0], currentColor: string | undefined = colors[0], isAdding: boolean | undefined = true): number {
  if (currentColor && textElement.style.color != currentColor) textElement.style.color = currentColor;

  if (isAdding) {
    textElement.textContent = currentText.slice(0, textElement.textContent.length + step);
    if (textElement.textContent.length >= currentText.length) return setTimeout(() => updateText(currentText, currentColor, false), msInSecond);
  }
  else {
    textElement.textContent = textElement.textContent.slice(0, -step);
    if (textElement.textContent.length <= 0) return setTimeout(() => updateText(...getTextAndColor.next().value, true), msInSecond);
  }

  return setTimeout(() => updateText(currentText, currentColor, isAdding), updateTimeoutMs);
})();
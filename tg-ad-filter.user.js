// ==UserScript==
// @name        Telegram Ad Filter
// @version     1.0.0
// @description Collapses messages that contain words from the ad-word list
// @license     MIT
// @author      VChet
// @icon        https://web.telegram.org/favicon.ico
// @namespace   Telegram-Ad-Filter
// @match       https://web.telegram.org/*
// @grant       GM_addStyle
// @updateURL   https://raw.githubusercontent.com/VChet/Telegram-Ad-Filter/master/tg-ad-filter.user.js
// @downloadURL https://raw.githubusercontent.com/VChet/Telegram-Ad-Filter/master/tg-ad-filter.user.js
// ==/UserScript==

/* jshint esversion: 11 */
(async () => {
  GM_addStyle(`
    .bubble:not(.has-advertisement) .advertisement,
    .bubble.has-advertisement .bubble-content *:not(.advertisement),
    .message-content-wrapper:not(.has-advertisement) .advertisement,
    .message-content-wrapper.has-advertisement .bubble-content *:not(.advertisement) {
      display: none;
    }
    .advertisement {
      position: relative;
      padding: 0.5rem 1rem;
      text-decoration: underline dotted;
      cursor: pointer;
      font-weight: bold;
      color: var(--link-color);
    }
  `);

  const classMap = {
    "/k/": {
      wrapper: "bubble",
      content: "bubble-content",
      message: "message",
    },
    "/z/": {
      wrapper: "message-content-wrapper",
      content: "message-content",
      message: "message-content",
    },
  };
  const classes = classMap[window.location.pathname];

  let adWords = [];
  function fetchWords() {
    return fetch("https://raw.githubusercontent.com/VChet/Telegram-Ad-Filter/master/blacklist.json")
      .then((response) => response.json())
      .then((data) => data);
  }

  function applyStyles(node) {
    const message = node.querySelector(`.${classes.message}`);
    if (!message?.innerText) return;
    const hasAdWord = adWords.some((filter) => message.innerText.toLowerCase().includes(filter.toLowerCase()));
    if (!hasAdWord || node.querySelector(".advertisement")) return;

    const trigger = document.createElement("div");
    trigger.classList.add("advertisement");
    trigger.innerText = "Advertisement";
    node.querySelector(`.${classes.content}`).prepend(trigger);

    node.classList.add("has-advertisement");
    trigger.addEventListener("click", () => { node.classList.remove("has-advertisement"); });
    message.addEventListener("click", () => { node.classList.add("has-advertisement"); });
  }

  function walk(node) {
    if (!node.nodeType) { return; }
    let child = null;
    let next = null;
    switch (node.nodeType) {
      case 1: // Element
      case 9: // Document
      case 11: // Document fragment
        if (node.classList?.contains(classes.wrapper)) { applyStyles(node); }
        child = node.firstChild;
        while (child) {
          next = child.nextSibling;
          walk(child);
          child = next;
        }
        break;
      case 3: // Text node
      default:
        break;
    }
  }

  function mutationHandler(mutationRecords) {
    mutationRecords.forEach(({ type, addedNodes }) => {
      if (type === "childList" && typeof addedNodes === "object" && addedNodes.length) {
        addedNodes.forEach((node) => { walk(node); });
      }
    });
  }

  adWords = await fetchWords();
  const observer = new MutationObserver(mutationHandler);
  observer.observe(document, { childList: true, subtree: true, attributeFilter: ["class"] });
})();

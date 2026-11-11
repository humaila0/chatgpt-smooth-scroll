# ChatGPT Smooth Scroll

A simple Chrome Manifest V3 extension that makes navigating long ChatGPT conversations easier and more convenient.

## Problem

While using ChatGPT for learning and coding, I noticed that navigating long conversations could become frustrating. As chats grew longer, the scrollbar was sometimes difficult to access or seemed to disappear, making it inconvenient to move between older and newer messages.

## Solution

I built **ChatGPT Smooth Scroll**, a Chrome extension that adds floating navigation buttons to ChatGPT for easier scrolling.

During development, I encountered a bug where the scroll-down button worked, but the scroll-up button did not work correctly. I debugged the issue by improving scroll-container detection and adjusting the button logic to prevent scrolling controls from being incorrectly disabled.

## Features

- Smooth scrolling up and down
- Quick navigation to the top and bottom of a conversation
- Floating navigation buttons
- Keyboard shortcuts for easier navigation
- Automatic detection of ChatGPT's scroll container
- No API key or backend required
- Designed to run on ChatGPT only

## Technologies Used

- JavaScript
- HTML
- CSS
- Chrome Extension Manifest V3
- DOM manipulation
- MutationObserver

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Google Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extension folder.
6. Open or refresh [ChatGPT](https://chatgpt.com/).

## Keyboard Shortcuts

- `Alt + ↑` — Scroll up
- `Alt + ↓` — Scroll down
- `Alt + Home` — Go to the top
- `Alt + End` — Go to the bottom

## What I Learned

- Building a Chrome extension using Manifest V3
- Manipulating webpage elements with JavaScript
- Detecting and controlling scrollable containers
- Using MutationObserver to monitor dynamic webpage changes
- Debugging real-world scrolling issues
- Improving user experience by solving a practical problem

## Privacy

The extension is designed to handle scrolling locally in the browser. It does not require an API key, backend, or external server to provide its scrolling functionality.

## Feedback and Contributions

This project was built to solve a small but frustrating problem I experienced while using ChatGPT for learning and coding.

If you find it useful, **please consider giving this repository a ⭐ star**. Feedback, suggestions, and contributions are welcome!

**Note:** ChatGPT's internal DOM structure may change over time, so scroll-container detection may require future updates.

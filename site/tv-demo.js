(function () {
  'use strict';

  var root = document.getElementById('tv-demo');
  if (!root) return;

  var questions = [
    { subject: '数学 · 二年级', q: '42 - 26 = ?', options: ['18', '7', '6', '16'], correct: 3, tip: '答案是 16。' },
    { subject: '数学 · 二年级', q: '5 + 54 = ?', options: ['59', '68', '58', '50'], correct: 0, tip: '答案是 59。' },
    { subject: '数学 · 二年级', q: '29 - 19 = ?', options: ['9', '19', '10', '0'], correct: 2, tip: '答案是 10。' }
  ];

  var letters = ['A', 'B', 'C', 'D'];
  var state = { started: false, index: 0, focused: 0, answered: false, score: 0 };

  var subject = document.getElementById('demo-subject');
  var current = document.getElementById('demo-current');
  var question = document.getElementById('demo-question');
  var options = document.getElementById('demo-options');
  var dots = document.getElementById('demo-dots');
  var startPanel = document.getElementById('demo-start');
  var startButton = document.getElementById('demo-start-btn');
  var feedback = document.getElementById('demo-feedback');
  var feedbackTitle = document.getElementById('demo-feedback-title');
  var feedbackAnswer = document.getElementById('demo-feedback-answer');
  var feedbackTip = document.getElementById('demo-feedback-tip');
  var continueButton = document.getElementById('demo-continue');
  var result = document.getElementById('demo-result');
  var score = document.getElementById('demo-score');
  var reward = document.getElementById('demo-reward');
  var resultNote = document.getElementById('demo-result-note');
  var retryButton = document.getElementById('demo-retry');

  function renderDots() {
    if (!dots) return;
    dots.innerHTML = questions.map(function (_, index) {
      var cls = index < state.index ? 'is-done' : index === state.index ? 'is-now' : '';
      return '<i class="' + cls + '"></i>';
    }).join('');
  }

  function setFocus(index, focusElement) {
    state.focused = Math.max(0, Math.min(questions[state.index].options.length - 1, index));
    Array.prototype.forEach.call(options.querySelectorAll('.demo-option'), function (button, i) {
      button.classList.toggle('is-focused', i === state.focused && !state.answered);
    });
    if (focusElement) {
      var button = options.querySelector('.demo-option[data-index="' + state.focused + '"]');
      if (button) button.focus({ preventScroll: true });
    }
  }

  function renderQuestion() {
    var item = questions[state.index];
    subject.textContent = item.subject;
    current.textContent = String(state.index + 1);
    question.textContent = item.q;
    state.answered = false;
    state.focused = 0;
    feedback.hidden = true;
    feedback.classList.remove('is-wrong');
    result.hidden = true;

    options.innerHTML = item.options.map(function (value, index) {
      return '<button class="demo-option' + (index === 0 ? ' is-focused' : '') + '" type="button" data-index="' + index + '" aria-label="' + letters[index] + '，' + value + '">' +
        '<span class="letter" aria-hidden="true">' + letters[index] + '</span>' +
        '<span>' + value + '</span>' +
      '</button>';
    }).join('');

    Array.prototype.forEach.call(options.querySelectorAll('.demo-option'), function (button) {
      button.addEventListener('click', function () {
        if (state.answered) return;
        answer(Number(button.getAttribute('data-index')));
      });
      button.addEventListener('focus', function () {
        setFocus(Number(button.getAttribute('data-index')));
      });
    });

    renderDots();
  }

  function answer(index) {
    if (!state.started || state.answered) return;
    var item = questions[state.index];
    var right = index === item.correct;
    state.answered = true;
    state.focused = index;
    if (right) state.score += 1;

    Array.prototype.forEach.call(options.querySelectorAll('.demo-option'), function (button, i) {
      button.classList.remove('is-focused');
      button.disabled = true;
      if (i === item.correct) button.classList.add('is-correct');
      if (i === index && !right) button.classList.add('is-wrong');
    });

    feedbackTitle.textContent = right ? '答对了' : '再想一想';
    feedbackAnswer.textContent = '正确答案：' + item.options[item.correct];
    feedbackTip.textContent = item.tip;
    feedback.classList.toggle('is-wrong', !right);
    feedback.hidden = false;
    continueButton.focus({ preventScroll: true });
  }

  function showResult() {
    feedback.hidden = true;
    result.hidden = false;
    score.textContent = String(state.score);
    var passed = state.score === questions.length;
    reward.textContent = passed ? '获得 10 分钟' : '获得 0 分钟';
    resultNote.textContent = passed ? '三题全对，按演示设定解锁 10 分钟。' : '还差 ' + (questions.length - state.score) + ' 题。三题全对可解锁 10 分钟（演示设定）。';
    retryButton.focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (state.index >= questions.length - 1) {
      showResult();
      return;
    }
    state.index += 1;
    renderQuestion();
    root.focus({ preventScroll: true });
  }

  function startDemo() {
    state.started = true;
    state.index = 0;
    state.score = 0;
    startPanel.hidden = true;
    result.hidden = true;
    renderQuestion();
    root.focus({ preventScroll: true });
  }

  function resetDemo() {
    state.started = false;
    state.index = 0;
    state.focused = 0;
    state.answered = false;
    state.score = 0;
    feedback.hidden = true;
    result.hidden = true;
    startPanel.hidden = false;
    renderQuestion();
    startButton.focus({ preventScroll: true });
  }

  function moveFocus(direction) {
    if (!state.started || !feedback.hidden || !result.hidden) return;
    var index = state.focused;
    if (direction === 'left' && index % 2 === 1) index -= 1;
    if (direction === 'right' && index % 2 === 0 && index + 1 < questions[state.index].options.length) index += 1;
    if (direction === 'up' && index >= 2) index -= 2;
    if (direction === 'down' && index + 2 < questions[state.index].options.length) index += 2;
    setFocus(index, true);
  }

  function handleAction() {
    if (!state.started) {
      startDemo();
      return;
    }
    if (!feedback.hidden) {
      nextQuestion();
      return;
    }
    if (!result.hidden) return;
    answer(state.focused);
  }

  if (startButton) startButton.addEventListener('click', startDemo);
  if (continueButton) continueButton.addEventListener('click', nextQuestion);
  if (retryButton) retryButton.addEventListener('click', startDemo);
  var resetButton = document.getElementById('demo-reset');
  if (resetButton) resetButton.addEventListener('click', resetDemo);

  Array.prototype.forEach.call(root.querySelectorAll('[data-dir]'), function (button) {
    button.addEventListener('click', function () {
      if (!state.started) startDemo();
      moveFocus(button.getAttribute('data-dir'));
    });
  });

  var okButton = root.querySelector('[data-ok]');
  if (okButton) {
    okButton.addEventListener('click', function () {
      if (!state.started) startDemo();
      else if (!feedback.hidden) nextQuestion();
      else if (result.hidden) answer(state.focused);
    });
  }

  root.addEventListener('keydown', function (event) {
    var key = event.key;
    var actionKey = key === 'Enter' || key === ' ' || key === 'Spacebar';

    if (!state.started) {
      if (actionKey && document.activeElement === root) {
        event.preventDefault();
        startDemo();
      }
      return;
    }

    if (!result.hidden) return;

    if (!feedback.hidden) {
      if (actionKey) {
        event.preventDefault();
        nextQuestion();
      }
      return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(key.replace('Arrow', '').toLowerCase());
      return;
    }

    if (actionKey) {
      event.preventDefault();
      handleAction();
    }
  });

  root.addEventListener('click', function (event) {
    if (!event.target.closest('button')) root.focus({ preventScroll: true });
  });

  renderQuestion();
}());

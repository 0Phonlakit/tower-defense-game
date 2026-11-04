// App: the "Made By 0Phonlakit" splash shown on every launch.
(function (root) {
  'use strict';
  const TD = root.TD;
  const App = TD.App;

  Object.assign(App.prototype, {
    // ---------- Flow ----------
    // "Made By 0Phonlakit" fades in and out (CSS animation), then the save-slot screen fades in.
    // A click or key press skips it.
    showSplash() {
      const splash = this.$('ov-splash');
      this.showOverlay(null);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        splash.classList.add('leaving');
        setTimeout(() => { splash.hidden = true; }, 400);
        this.doc.removeEventListener('keydown', finish);
        this.openSlots();
      };
      splash.addEventListener('click', finish);
      this.doc.addEventListener('keydown', finish);
      splash.addEventListener('animationend', ev => { if (ev.animationName === 'splash-out') finish(); });
    },
  });
})(self);

'use strict';
const inquirer = require('inquirer');
const ui = new inquirer.ui.BottomBar();

function Loader() {
  this.setState = (state) => {
    ui.updateBottomBar(state);
  };
}

module.exports = Loader;

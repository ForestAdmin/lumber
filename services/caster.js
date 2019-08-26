function Caster() {
  this.toBoolean = value => ['true', true, '1', 1].includes(value);
}

module.exports = Caster;

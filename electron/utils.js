const oldConsole = console;

const createConsole = (label) => {
  const prefix = `[${label}]:`;
  
  const override = (fn) => (...args) => {
    fn(prefix, ...args);
  };

  return {
    log: override(oldConsole.log),
    info: override(oldConsole.info),
    warn: override(oldConsole.warn),
    assert: override(oldConsole.assert),
    error: override(oldConsole.error),
  };
}

module.exports = {
  createConsole,
}
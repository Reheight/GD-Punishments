const mapping = {
    w: 7 * 24 * 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };
  
  const toDate = (string) => {
    const match = string.match(/(?<number>[0-9]*)(?<unit>[a-z]*)/);
    if (match) {
      const {number, unit} = match.groups;
      const offset = number * mapping[unit];
      return new Date(Date.now() + offset);
    }
  }

module.exports.toDate = toDate;

function containsTimeConversion(input) {
    var time = /[0-9][h|d|w|m|y]/;
    return time.test(input);
}

module.exports.containsTimeConversion = containsTimeConversion;
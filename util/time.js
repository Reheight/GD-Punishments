const shortSinceToSeconds = input => {
    var p = input
           .replace('h', 'x3600')
           .replace('d', 'x86400')
           .replace('w', 'x604800')
           .replace('m', 'x2.628e+6')
           .replace('y', 'x3.154e+7').split('x')
    return (p[0] || 0) * (p[1] || 0)
  }

module.exports.shortSinceToSeconds = shortSinceToSeconds;

function containsTimeConversion(input) {
    var time = /[0-9][h|d|w|m|y]/;
    return time.test(input);
}

module.exports.containsTimeConversion = containsTimeConversion;
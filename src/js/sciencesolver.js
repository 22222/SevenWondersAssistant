window.sciencesolver = (function () {
    var valueUtil = {
        min: function () {
            return Array.prototype.sort.call(arguments, (function (l, r) { return l - r; }))[0];
        },
        calculateScore: function (tablet, gear, compass, setMultiplier) {
            if (typeof setMultiplier !== 'number') {
                setMultiplier = 7;
            }
            var score = (tablet * tablet) +
                    (gear * gear) +
                    (compass * compass) +
                    (setMultiplier * valueUtil.min(tablet, gear, compass));
            return score;
        }
    }

    // We'll be using a wrapper object around the values so we can sort 
    // them without losing track of which symbol the value represents.
    var valueWrapperUtil = {
        create: function (v) {
            return {
                value: v
            };
        },
        sort: function () {
            return Array.prototype.sort.call(arguments, (function (l, r) { return l.value - r.value; }));
        },
        min: function () {
            return valueWrapperUtil.sort.apply(this, arguments)[0];
        },
        max: function () {
            return valueWrapperUtil.sort.apply(this, arguments)[arguments.length - 1];
        }
    };

    // These are what we'll be returning 
    var resultUtil = {
        create: function (tablet, gear, compass, setMultiplier) {
            var result = {
                tablet: tablet,
                gear: gear,
                compass: compass,
                setMultiplier: setMultiplier
            };
            result.score = function () {
                return valueUtil.calculateScore(result.tablet, result.gear, result.compass, result.setMultiplier);
            };
            return result;
        },
        createFromValueWrappers: function (tabletWrapper, gearWrapper, compassWrapper, setMultiplier) {
            return resultUtil.create(tabletWrapper.value, gearWrapper.value, compassWrapper.value, setMultiplier);
        },
        max: function () {
            var sorted = Array.prototype.sort.call(arguments, (function (l, r) { return r.score() - l.score(); }));
            return sorted[0];
        }
    };

    var maximizeSets = function (a, b, c, w, m) {
        valueWrapperUtil.max(a, b, c).value += w;
        return resultUtil.createFromValueWrappers(a, b, c, m);
    };

    var maximizeRuns = function (a, b, c, w, m) {
        var sorted = valueWrapperUtil.sort(a, b, c);
        var min = sorted[0];
        var mid = sorted[1];
        var max = sorted[2];

        // First get the min one the same as the  mid one
        var adjustment1 = valueUtil.min((mid.value - min.value), w);
        min.value += adjustment1;
        w -= adjustment1;

        // Now get the lowest two the same as the max one
        if (min.value === mid.value && w >= 2) {
            var adjustment2 = valueUtil.min((max.value - mid.value) * 2, w);
            mid.value += Math.floor(adjustment2 / 2);
            min.value += Math.floor(adjustment2 / 2);
            w -= adjustment2;
        }

        // Now if everything is even so we just distribute everything that's left,
        // otherwise put it all into the max.
        if (min.value == max.value) {
            var third = Math.floor(w / 3);
            var remainder = w % 3;

            max.value += third;
            max.value += remainder;
            mid.value += third;
            min.value += third;
        } else if (w > 0) {
            max.value += w;
            w = 0;
        }

        return resultUtil.createFromValueWrappers(a, b, c, m);
    };
    var oneToMinThenMaximizeSets = function (a, b, c, w, m) {
        if (w > 0) {
            var min = valueWrapperUtil.min(a, b, c);
            min.value += 1;
            w -= 1;
        }
        return maximizeSets(a, b, c, w, m);
    };
    var assignWildcards = function (tablet, gear, compass, wildcard, setMultiplier) {
        var results = [];

        // I'm sure there's a fancier math way of doing this, but for now we'll just try all three possible assignment strategies and just take the best one.
        results.push(maximizeSets(valueWrapperUtil.create(tablet), valueWrapperUtil.create(gear), valueWrapperUtil.create(compass), wildcard, setMultiplier));
        results.push(maximizeRuns(valueWrapperUtil.create(tablet), valueWrapperUtil.create(gear), valueWrapperUtil.create(compass), wildcard, setMultiplier));
        results.push(oneToMinThenMaximizeSets(valueWrapperUtil.create(tablet), valueWrapperUtil.create(gear), valueWrapperUtil.create(compass), wildcard, setMultiplier));
        return resultUtil.max.apply(null, results);
    };

    var calculateScoreWithWilds = function (tablet, gear, compass, wildcard, setMultiplier) {
        var result = assignWildcards(tablet, gear, compass, wildcard, setMultiplier);
        return result.score();
    };

    return {
        assignWildcards: assignWildcards,
        calculateScoreWithWilds: calculateScoreWithWilds,
        createResult: resultUtil.create
    };
} ());
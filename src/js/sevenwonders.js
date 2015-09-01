(function () {
    var swapObservables = function(a, b) {
        var t = a();
        a(b());
        b(t);
    };

    var createGameModel = function () {
        var createExpansionModel = function (id, name) {
            var expansionModel = {
                id: id,
                name: name,
                active: ko.observable(false)
            };
            return expansionModel;
        };

        var leadersExpansion = createExpansionModel('leaders', 'Leaders');
        var citiesExpansion = createExpansionModel('cities', 'Cities');
        var towerOfBabelExpansion = createExpansionModel('towerOfBabel', 'Tower of Babel');
        var greatProjectsExpansion = createExpansionModel('greatProjects', 'Great Projects');
        var expansions = [
            leadersExpansion,
            citiesExpansion,
            towerOfBabelExpansion,
            greatProjectsExpansion
        ];

        var createOptionModel = function(id, name, options) {
            options = options || {};
            var available = options.available || ko.computed(function() { return true; })
            var activeByDefault = options.activeByDefault || false;

            var activeObservable = ko.observable(activeByDefault);
            var active = ko.computed({
                read: function() {
                    return available() ? activeObservable() : false;
                },
                write: function(value) {
                    activeObservable(value);
                }
            });

            var optionModel = {
                id: id,
                name: name,
                active: active,
                available: available,
            };
            return optionModel;
        };

        var teamsOption = createOptionModel('teams', 'Teams', {
            available: ko.computed(function() { return citiesExpansion.active(); }),
            activeByDefault: false
        });
        var options = [
            teamsOption
        ];
        var availableOptions = ko.computed(function() {
            return $.grep(options, function(o) { return o.available(); });
        });
        var isAvailableOption = ko.computed(function() {
            return availableOptions().length > 0;
        });

        var parseIntOrDefault = function (input, defaultValue) {
            var value = parseInt(input, 10);
            if (isNaN(value)) {
                value = defaultValue;
            }
            return value;
        };
        var parseIntOrZero = function (input) {
            return parseIntOrDefault(input, 0);
        };
        var parseAndBoundInt = function (value, bounds) {
            var valueInt = parseIntOrDefault(value, null);

            var min = ko.unwrap(bounds.min);
            var max = ko.unwrap(bounds.max);
            if (valueInt < min) {
                valueInt = min;
            } else if (valueInt > max) {
                valueInt = max;
            }
            return valueInt;
        };

        var createDefaultCategoryScoreModel = function (c) {
            var s = {
                scoreEditable: ko.observable(null)
            };
            s.score = ko.computed(function() {
                var score = s.scoreEditable();
                return parseAndBoundInt(score, { min: c.min, max: c.max});
            }).extend({ throttle: 400 });

            s.swapWith = function(other) {
                swapObservables(s.scoreEditable, other.scoreEditable);
            };
            s.clear = function () {
                s.scoreEditable(null);
            };
            s.toJS = function () {
                return s.score();
            };
            s.fromJS = function (js) {
                if (!js) {
                    return;
                }
                s.scoreEditable(js);
            };
            return s;
        };

        var createScienceCategoryScoreModel = function (c) {
            var s = {
                tabletEditable: ko.observable(null),
                gearEditable: ko.observable(null),
                compassEditable: ko.observable(null),
                wildEditable: ko.observable(null),
                isAristotleActive: ko.computed(function() { return leadersExpansion.active(); }),
                hasAristotle: ko.observable(false),
            };
            s.tablet = ko.computed(function() {
                return parseAndBoundInt(s.tabletEditable(), { min: c.min, max: c.max});
            }).extend({ throttle: 400 });
            s.gear = ko.computed(function() {
                return parseAndBoundInt(s.gearEditable(), { min: c.min, max: c.max});
            }).extend({ throttle: 400 });
            s.compass = ko.computed(function() {
                return parseAndBoundInt(s.compassEditable(), { min: c.min, max: c.max});
            }).extend({ throttle: 400 });
            s.wild = ko.computed(function() {
                return parseAndBoundInt(s.wildEditable(), { min: c.min, max: c.max});
            }).extend({ throttle: 400 });
            s.setMultiplier = ko.computed(function () { return (s.isAristotleActive() && s.hasAristotle()) ? 10 : 7; });
            s.score = ko.computed(function () {
                return sciencesolver.calculateScoreWithWilds(
                    parseIntOrZero(s.tablet()), parseIntOrZero(s.gear()), parseIntOrZero(s.compass()), parseIntOrZero(s.wild()), s.setMultiplier()
                );
            });

            s.swapWith = function(other) {
                swapObservables(s.tabletEditable, other.tabletEditable);
                swapObservables(s.gearEditable, other.gearEditable);
                swapObservables(s.compassEditable, other.compassEditable);
                swapObservables(s.wildEditable, other.wildEditable);
                swapObservables(s.hasAristotle, other.hasAristotle);
            };
            s.clear = function () {
                s.tabletEditable(null);
                s.gearEditable(null);
                s.compassEditable(null);
                s.wildEditable(null);
                s.hasAristotle(false);
            };
            s.toJS = function () {
                var js = {};
                js.tablet = s.tabletEditable();
                js.gear = s.gearEditable();
                js.compass = s.compassEditable();
                js.wild = s.wildEditable();
                js.hasAristotle = s.hasAristotle() === true;
                return js;
            };
            s.fromJS = function (js) {
                if (!js) {
                    return;
                }
                s.tabletEditable(js.tablet);
                s.gearEditable(js.gear);
                s.compassEditable(js.compass);
                s.wildEditable(js.wild);
                s.hasAristotle(js.hasAristotle === true);
            };

            s.scienceExplanation = ko.computed(function() {
                var tabletCount = parseIntOrZero(s.tablet());
                var gearCount = parseIntOrZero(s.gear());
                var compassCount = parseIntOrZero(s.compass());
                var wildCount = parseIntOrZero(s.wild());
                var setMultiplier = s.setMultiplier();

                var result = sciencesolver.assignWildcards(
                    tabletCount, gearCount, compassCount, wildCount, setMultiplier
                );

                var tabletWilds = result.tablet - tabletCount;
                var gearWilds = result.gear - gearCount;
                var compassWilds = result.compass - compassCount;

                var resultHtml = '';
                if (wildCount > 0) {
                    resultHtml += 'Wilds: ' + tabletWilds + ' tablets, ' + gearWilds + ' gears, ' + compassWilds + ' compasses.<br /><br />';
                }

                if (s.isAristotleActive() && s.hasAristotle()) {
                    resultHtml += 'Aristotle leader: set bonus increased to 10<br /><br />';
                }

                var explainCategory = function(name, totalCount, wildCount) {
                    var resultHtml = '';
                    var standardCount = totalCount - wildCount;
                    resultHtml += '(' + standardCount + ' ' + name;
                    if (standardCount !== 1)
                    {
                        if (name[name.length - 1] === 's')
                        {
                            resultHtml += 'e';
                        }
                        resultHtml += 's';
                    }
                    if (wildCount > 0) {
                        resultHtml += ' + ' + wildCount + ' wild';
                        if (wildCount !== 1)
                        {
                            resultHtml += 's';
                        }
                    }
                    resultHtml += ')&#178;';
                    return resultHtml;
                }

                //resultHtml += '<p>';

                if (result.tablet)
                {
                    resultHtml += explainCategory('tablet', result.tablet, tabletWilds);
                }
                if (result.gear)
                {
                    if (result.tablet)
                    {
                        resultHtml += ' + ';
                    }
                    resultHtml += explainCategory('gear', result.gear, gearWilds);
                }
                if (result.compass)
                {
                    if (result.tablet || result.gear)
                    {
                        resultHtml += ' + ';
                    }
                    resultHtml += explainCategory('compass', result.compass, compassWilds);
                }

                var completeSetCount = Math.min(result.tablet, Math.min(result.gear, result.compass));
                if (completeSetCount)
                {
                    if (result.tablet || result.gear || result.compass)
                    {
                        resultHtml += ' + ';
                    }

                    resultHtml += result.setMultiplier + ' * ';
                    resultHtml += '(' + completeSetCount + ' complete set';
                    if (completeSetCount !== 1) {
                        resultHtml += 's';
                    }
                    resultHtml += ')';
                }

                resultHtml += ' = ' + result.score();

                //resultHtml += '</p>';

                return resultHtml;
            });
            return s;
        };

        var createTowerOfBabelCategoryScoreModel = function (c) {
            var s = {
                babelTileCountEditable: ko.observable(null)
            };
            s.babelTileCount = ko.computed(function() {
                var count = s.babelTileCountEditable();
                return parseAndBoundInt(count, { min: c.min, max: c.max});
            }).extend({ throttle: 400 });

            s.score = ko.computed(function () {
                var babelTileCountInt = parseIntOrZero(s.babelTileCount());
                if (isNaN(babelTileCountInt)) {
                    return null;
                }
                if (babelTileCountInt <= 0) {
                    return 0;
                }
                return Math.pow(babelTileCountInt, 2) + 1;
            });

            s.swapWith = function(other) {
                swapObservables(s.babelTileCountEditable, other.babelTileCountEditable);
            };
            s.clear = function () {
                s.babelTileCountEditable(null);
            };
            s.toJS = function () {
                var js = {};
                js.babelTileCount = s.babelTileCount();
                return js;
            };
            s.fromJS = function (js) {
                if (!js) {
                    return;
                }
                s.babelTileCountEditable(js.babelTileCount);
            };

            return s;
        };

        var createCategory = function (id, name, options) {
            options = options || {};

            var min = ko.isComputed(options.min) ? options.min : parseIntOrZero(options.min);
            var max = ko.isComputed(options.max) ? options.max : parseIntOrDefault(options.max, 999);

            var c = {
                id: id,
                name: name,
                inputType: options.inputType || 'number',
                min: min,
                max: max,
                categoryValueTemplate: options.categoryValueTemplate || "categoryDefaultTemplate",
                playerValueTemplate: options.playerValueTemplate || "playerDefaultTemplate"
            };
            if (options.requiredExpansion) {
                c.active = ko.computed(function () {
                    return options.requiredExpansion.active();
                });
                c.conditional = true;
            } else {
                c.active = ko.computed(function () {
                    return true;
                });
                c.conditional = false;
            }
            c.createScoreModel = options.createScoreModel || createDefaultCategoryScoreModel;

            return c;
        };

        var scienceCategory = createCategory('science', 'Science', { 
            max: 99,
            categoryValueTemplate: "categoryScienceTemplate",
            playerValueTemplate: "playerScienceTemplate",
            createScoreModel: createScienceCategoryScoreModel
        });
        var leadersCategory = createCategory('leaders', 'Leaders', { requiredExpansion: leadersExpansion });
        var citiesCategory = createCategory('cities', 'Cities', { requiredExpansion: citiesExpansion });
        var towerOfBabelCategory = createCategory('towerOfBabel', 'Tower of Babel', { 
            requiredExpansion: towerOfBabelExpansion,
            categoryValueTemplate: "categoryTowerOfBabelTemplate",
            playerValueTemplate: "playerTowerOfBabelTemplate",
            createScoreModel: createTowerOfBabelCategoryScoreModel,
             max: 3

        });
        var greatProjectsCategory = createCategory('greatProjects', 'Great Projects', { 
            requiredExpansion: greatProjectsExpansion,
             min: -99
        });

        var categories = [
            createCategory('military', 'Military', { 
                // Going with a much less constrained version for now, because some expansions can increase the range 
                // (at least Babel has extra defeat and victory tokens as a possibility)
                min: -999,
                max: 999
                // min: ko.computed(function() { 
                //     var val = -6;  
                //     if (teamsOption.active()) val = val * 2; 
                //     return val;
                // }), 
                // max: ko.computed(function() { 
                //     var val = 18;
                //     if (teamsOption.active()) val = val * 2; 
                //     return val;
                // })
            }),
            createCategory('treasury', 'Money', { min: -999 }),
            createCategory('wonder', 'Wonders', { max: 99 }),
            createCategory('civilian', 'Civilian'),
            createCategory('commercial', 'Commercial'),
            createCategory('guilds', 'Guilds'),
            scienceCategory,
            leadersCategory,
            citiesCategory,
            towerOfBabelCategory,
            greatProjectsCategory
        ];

        var activeCategories = ko.computed(function () {
            var activeCategories = [];
            $.each(categories, function (i, c) {
                if (c.active() === true) {
                    activeCategories.push(c);
                }
            });
            return activeCategories;
        });
        var firstActiveCategory = ko.computed(function () {
            return activeCategories()[0];
        });

        // Add navigation to all of the categories 
        // (which is done separately because it depends on the category and activeCategory arrays)
        $.each(categories, function (i, c) {
            // Some special handling for science and expanstion-dependent categories because they are the only ones 
            // that can change their next stuff.  This is just for performance reasons 
            // (the complicated version would actually work for everything).
            if (c == scienceCategory || c.conditional === true) {
                c.next = ko.computed(function () {
                    var currentActiveCategories = activeCategories();
                    var nextCategory;
                    var i = $.inArray(c, currentActiveCategories);
                    if (i < currentActiveCategories.length - 1) {
                        nextCategory = currentActiveCategories[i + 1];
                    }
                    return nextCategory;
                });
                c.hasNext = ko.computed(function () {
                    return typeof c.next() === 'object';
                });
            } else {
                var nextCategory = categories[i + 1];
                c.next = ko.computed(function () {
                    return nextCategory;
                });
                c.hasNext = ko.computed(function () {
                    return true;
                });
            }
        });

        var createScoreModel = function () {
            var s = {};

            // One score for each category
            $.each(categories, function (i, c) {
                s[c.id] = c.createScoreModel(c);
            });

            // The total just adds up each individual category score
            s.total = ko.computed(function () {
                var sum = 0;
                var c;
                for (i in categories) {
                    var c = categories[i];
                    sum += parseIntOrZero(s[c.id].score());
                }
                return sum;
            });

            s.swapWith = function(other) {
                $.each(categories, function (i, c) {
                    s[c.id].swapWith(other[c.id]);
                });
            };
            s.clear = function () {
                $.each(categories, function (i, c) {
                    s[c.id].clear();
                });
            };
            s.toJS = function () {
                var js = {};
                $.each(categories, function (i, c) {
                    js[c.id] = s[c.id].toJS();
                });
                return js;
            };
            s.fromJS = function (js) {
                if (!js) {
                    return;
                }
                $.each(categories, function (i, c) {
                    s[c.id].fromJS(js[c.id]);
                });
            };

            return s;
        };

        var isNullOrWhitespace = function (input) {
            if (input == null) {
                return true;
            }
            return input.replace(/\s/g, '').length < 1;
        };

        var absoluteMinimumEditablePlayerCount = 3;
        var minimumEditablePlayerCount = ko.observable(absoluteMinimumEditablePlayerCount);
        var maximumEditablePlayerCount = ko.computed(function() {
            return citiesExpansion.active() ? 8 : 7;
        });

        var createPlayerModel = function (number) {
            var p = {
                id: "player" + number,
                label: "Player " + number,
                number: number,
                nameEditable: ko.observable(''),
                score: createScoreModel()
            };
            p.name = ko.computed(p.nameEditable).extend({ throttle: 400 });

            if (number <= 3) {
                p.nameOrDefault = ko.computed(function () {
                    var name = p.name();
                    if (name && name.length > 30) {
                        name = name.substring(0, 30);
                    }
                    return !isNullOrWhitespace(name) ? name : "Player " + number;
                });
                p.active = ko.computed(function () {
                    return true;
                });
            } else {
                p.nameOrDefault = ko.computed(function () {
                    return p.name();
                });
                p.active = ko.computed(function () {
                    if (p.number > maximumEditablePlayerCount()) {
                        return false;
                    }
                    return !isNullOrWhitespace(p.name());
                });
            }

            p.hasScienceScoreExplanation = ko.computed(function() {
                var scienceScore = p.score[scienceCategory.id];
                return scienceScore.score() > 0;
            });
            p.scienceScoreExplanation = ko.computed(function() {
                var scienceScore = p.score[scienceCategory.id];
                return scienceScore.scienceExplanation();
            });

            p.swapWith = function(other) {
                swapObservables(p.nameEditable, other.nameEditable);
                p.score.swapWith(other.score);
            };
            p.clear = function () {
                p.nameEditable('');
                p.score.clear();
            }
            p.clearScores = function () {
                p.score.clear();
            }
            p.toJS = function () {
                var js = {};
                js.name = p.name();
                js.score = p.score.toJS();
                return js;
            };
            p.fromJS = function (js) {
                p.nameEditable(js.name);
                p.score.fromJS(js.score);
            };

            return p;
        };

        var playerCount = 8;
        var createPlayers = function () {
            var players = [];
            var i;
            for (i = 1; i <= playerCount; i++) {
                players.push(createPlayerModel(i));
            }
            return players;
        };
        var players = createPlayers();
        var activePlayers = ko.computed(function () {
            return $.grep(players, function (p) { return p.active(); });
        });
        var firstActivePlayer = ko.computed(function () {
            return activePlayers()[0];
        });

        $.each(players, function (i, p) {
            p.next = ko.computed(function () {
                var currentActivePlayers = activePlayers();
                var nextPlayer;
                var i = $.inArray(p, currentActivePlayers);
                if (i < currentActivePlayers.length - 1) {
                    nextPlayer = currentActivePlayers[i + 1];
                }
                return nextPlayer;
            });
            p.hasNext = ko.computed(function () {
                return typeof p.next() === 'object';
            });

            var playerNumber = i + 1;
            p.playerNumber = playerNumber;
            if (playerNumber <= 2) {
                p.isEditable = ko.computed(function () {
                    return true;
                });
            } else {
                var previousPlayer = players[i - 1];
                var previousPreviousPlayer = players[i - 2];
                var nextPlayers = players.slice(i);
                p.isEditable = ko.computed(function () {
                    if (playerNumber > maximumEditablePlayerCount()) {
                        return false;
                    }
                    if (playerNumber <= minimumEditablePlayerCount()) {
                        return true;
                    }
                    return p.active() || !isNullOrWhitespace(previousPlayer.name()) || !isNullOrWhitespace(previousPreviousPlayer.name()) || $.grep(nextPlayers, function (p) { return p.active(); }).length > 0;
                });
            }
        });

        var editablePlayers = ko.computed(function () {
            return $.grep(players, function (p) { return p.isEditable(); });
        });
        var isAddPlayerActionAvailable = ko.computed(function() {
            var editablePlayerCount = editablePlayers().length;
            var maximumPlayerCount = maximumEditablePlayerCount();
            return editablePlayerCount < maximumPlayerCount;
        });
        var addPlayer = function() {
            var editablePlayerCount = editablePlayers().length;
            var maximumPlayerCount = maximumEditablePlayerCount();
            if (editablePlayerCount < maximumPlayerCount) {
                minimumEditablePlayerCount(editablePlayerCount + 1);
            }
        };
        var removePlayer = function(player) {
            // We never actually remove a player, but we can remove the data from this player 
            // and shift up the data from any players that come after this one.
            player.clear();
            var index = player.playerNumber - 1;
            var nextPlayers = players.slice(index);

            var clearedPlayer = player;
            $.each(nextPlayers, function(i, p) {
                p.swapWith(clearedPlayer);
                p.clear();
                clearedPlayer = p;
            });

            var editablePlayerCount = minimumEditablePlayerCount() - 1;
            editablePlayerCount = Math.max(absoluteMinimumEditablePlayerCount, editablePlayerCount);
            minimumEditablePlayerCount(editablePlayerCount);
        };

        var playersByScore = ko.computed(function () {
            var playersClone = players.slice(0);
            playersClone.sort(function (l, r) { return r.score.total() - l.score.total(); })
            return playersClone;
        });

        var createTeamModel = function (number) {
            var team = {
                id: "team" + number,
                label: "Team " + number,
                name: "Team " + number,
                number: number
            };

            var firstPlayerIndex = (number - 1) * 2;

            var playerTeam = ko.computed(function() {
                if (!teamsOption.active()) {
                    return {};
                }
                return team;
            });

            var firstPlayer = players[firstPlayerIndex];
            firstPlayer.team = playerTeam;
            firstPlayer.isTeamStart = ko.computed(function() { return teamsOption.active() ? true : false; });

            var secondPlayer = players[firstPlayerIndex + 1];
            secondPlayer.team = playerTeam;
            secondPlayer.isTeamStart = ko.computed(function() { return false; });

            team.players = [firstPlayer, secondPlayer];
            team.totalScore = ko.computed(function() {
                return firstPlayer.score.total() + secondPlayer.score.total();
            });
            team.active = ko.computed(function() {
                return firstPlayer.active();
            });

            return team;
        };

        var teamCount = playerCount / 2;
        var createTeams = function () {
            var teams = [];
            var i;
            for (i = 1; i <= teamCount; i++) {
                teams.push(createTeamModel(i));
            }
            return teams;
        };
        var teams = createTeams();
        var teamsByScore = ko.computed(function () {
            var teamsClone = teams.slice(0);
            teamsClone.sort(function (l, r) { return r.totalScore() - l.totalScore(); })
            return teamsClone;
        });

        var gameModel = {
            players: players,
            playersByScore: playersByScore,

            isTeams: ko.computed(function() { return teamsOption.active(); }),
            teams: teams,
            teamsByScore: teamsByScore,

            categories: categories,
            scienceCategory: scienceCategory,
            expansions: expansions,
            options: options,
            isAvailableOption: isAvailableOption,

            activePlayers: activePlayers,
            firstActivePlayer: firstActivePlayer,
            isAddPlayerActionAvailable: isAddPlayerActionAvailable,
            addPlayer: addPlayer,
            removePlayer: removePlayer,

            activeCategories: activeCategories,
            firstActiveCategory: firstActiveCategory
        };
        gameModel.clear = function () {
            $.each(gameModel.players, function (i, p) {
                p.clear();
            });
            minimumEditablePlayerCount(absoluteMinimumEditablePlayerCount);
        };
        gameModel.clearScores = function () {
            $.each(gameModel.players, function (i, p) {
                p.clearScores();
            });
        };
        gameModel.toJS = function () {
            var js = {};

            js.players = [];
            $.each(gameModel.players, function (i, p) {
                if (p.active() === true) {
                    js.players.push(p.toJS());
                }
            });

            js.expansions = {};
            $.each(gameModel.expansions, function (i, e) {
                js.expansions[e.id] = e.active();
            });

            js.options = {};
            $.each(gameModel.options, function(i, o) {
                js.options[o.id] = o.active();
            });

            return js;
        };
        gameModel.toJSON = function () {
            var js = gameModel.toJS();
            return JSON.stringify(js);
        };
        gameModel.fromJS = function (js) {
            if (js.players) {
                var i;
                for (i = 0; i < gameModel.players.length; i++) {
                    if (i < js.players.length) {
                        var p = js.players[i];
                        gameModel.players[i].fromJS(p);
                    } else {
                        gameModel.players[i].clear();
                    }
                }
            }

            if (js.expansions) {
                $.each(gameModel.expansions, function (i, e) {
                    e.active(js.expansions[e.id] !== false);
                });
            }

            if (js.options) {
                $.each(gameModel.options, function (i, o) {
                    o.active(js.options[o.id] !== false);
                });
            }
        };

        gameModel.saveToLocalStorage = function () {
            if (!window.localStorage) {
                return;
            }

            var js = gameModel.toJS();
            var jsString = JSON.stringify(js);
            window.localStorage.setItem('sevenwonders.currentGame', jsString);
        };
        gameModel.loadFromLocalStorage = function () {
            if (!window.localStorage) {
                return;
            }

            try {
                var jsString = window.localStorage.getItem('sevenwonders.currentGame');
                var js = JSON.parse(jsString);
                if (typeof js === 'object' && js !== null) {
                    gameModel.fromJS(js);
                }
            } catch (e) {
                window.console && console.log(e);
            }
        };

        return gameModel;
    };

    var initializePersistence = function (gameModel) {
        // Load the current game (if any) right at the start
        gameModel.loadFromLocalStorage();

        // Write to local storage on every page hide
        $(document).on('pagebeforehide', '[data-role="page"]', function () {
            gameModel.saveToLocalStorage();
        });

        // Write to local storage when leaving the page
        $(window).unload(function () {
            gameModel.saveToLocalStorage();
        });
    };

    $(document).on("mobileinit", function () {
        $.mobile.page.prototype.options.addBackBtn = true;
        $(function () {
            var gameModel = createGameModel();
            initializePersistence(gameModel);
            ko.applyBindings(gameModel);
            $.mobile.initializePage();
        });
    });
})();


(function () {
  var picker;

  picker = angular.module('daterangepicker', []);

  picker.constant('dateRangePickerConfig', {
    clearLabel: 'Clear'
  });

  picker.directive('dateRangePicker', [
    '$compile',
    '$timeout',
    '$parse',
    'dateRangePickerConfig',
    '$filter',
    function ($compile, $timeout, $parse, dateRangePickerConfig, $filter) {
      return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
          min: '=',
          max: '=',
          opts: '=options',
          clearable: '=',
          hidePredefinedRanges: '=',
          time: '=',
          icon: '@',
          single: '=',
        },
        link: function ($scope, element, attrs, modelCtrl) {
          var customOpts, opts, _clear, _format, _init, _initBoundaryField, _mergeOpts, _picker, _setDatePoint, _setEndDate, _setStartDate, _setDateInputValue;

          _mergeOpts = function () {
            var extend, localeExtend;
            localeExtend = angular
              .extend
              .apply(angular, Array.prototype.slice.call(arguments)
                .map(function (opt) {
                  return opt != null ? opt.locale : void 0;
                }).filter(function (opt) {
                  return !!opt;
                })
              );
            extend = angular.extend.apply(angular, arguments);
            extend.locale = localeExtend;
            return extend;
          };

          $scope.icon = $scope.icon || 'icon-datepicker';

          wrapEl = element.wrap('<div class="alxDirectiveSuiDatepicker"></div>');
          element.after('<i class="icon ' + $scope.icon + '"></i>');
          element.prop('readonly', 'readonly');

          dateRangePickerConfig.locale = {
            separator: ' - ',
            format: 'YYYY-MM-DD, hh:mm A',
            formatDate: 'YYYY-MM-DD',
            invalidLabel: $filter('translate')('common.infinite') || 'Infinite',
            applyLabel: $filter('translate')('common.ok') || 'OK',
            cancelLabel: $filter('translate')('common.cancel'),
            customRangeLabel: $filter('translate')('common.date_range') || 'Custom Range',
            daysOfWeek: moment.weekdaysMin(),
            monthNames: moment.monthsShort(),
            firstDay: 0, // TODO: moment.localeData().firstDayOfWeek()
            startDate: $filter('translate')('common.start_date'),
            endDate: $filter('translate')('common.end_date') || 'End date',
            pickTime: $filter('translate')('common.pick_time') || 'Pick time:',
            nowLabel: $filter('translate')('common.now') || 'Now',
            date: $filter('translate')('common.date') || 'Date',
          }

          customOpts = $scope.opts;
          opts = _mergeOpts({}, dateRangePickerConfig, customOpts);
          opts.singleDateAndTime = !!$scope.single;

          if ($scope.time) {
            opts.timePicker = true;
          }

          if (!$scope.hidePredefinedRanges && !$scope.single) {
            opts.ranges = {
              'today': {
                0: moment().startOf('day'),
                1: moment().endOf('day'),
                displayName: $filter('translate')('common.today'),
                hideTimePicker: true
              },
              'yesterday': {
                0: moment().subtract(1, 'days').startOf('day'),
                1: moment().subtract(1, 'days').endOf('day'),
                displayName: $filter('translate')('common.yesterday'),
                hideTimePicker: true
              },
              'last7days': {
                0: moment().subtract(6, 'days').startOf('day'),
                1: moment().endOf('day'),
                displayName: $filter('translate')('backend.lookup.daterangetype_3'),
                hideTimePicker: true
              },
              'next7days': {
                0: moment().startOf('day'),
                1: moment().add(6, 'days').endOf('day'),
                displayName: $filter('translate')('common.datefilter.next7days'),
                hideTimePicker: true
              },
              'after_date': {
                0: moment().startOf('day'),
                1: null,
                displayName: $filter('translate')('common.datefilter.after_date')
              },
              'before_date': {
                0: null,
                1: moment().endOf('day'),
                displayName: $filter('translate')('common.datefilter.before_date')
              },
              'specific_date': {
                0: moment().startOf('day'),
                1: moment().endOf('day'),
                displayName: $filter('translate')('backend.lookup.daterangetype_103')
              },
            }
          }

          _picker = null;

          _clear = function () {
            _picker.setStartDate();
            return _picker.setEndDate();
          };

          // basically converts startDate/endDate props of model to moment instances
          _setDatePoint = function (setter) {
            return function (newValue) {
              if (_picker && newValue) {
                return setter(moment(newValue));
              }
            };
          };

          // datepicker setter for startdate
          _setStartDate = _setDatePoint(function (m) {

            if (_picker.endDate < m) {
              _picker.setEndDate(m);
            }
            return _picker.setStartDate(m);
          });

          // datepicker setter for enddate
          _setEndDate = _setDatePoint(function (m) {

            if (_picker.startDate > m) {
              _picker.setStartDate(m);
            }
            return _picker.setEndDate(m);
          });

          // helps format input with date/dates as string
          _formatterHelper = function (date, format) {
            if (!format) {
              format = opts.locale.format;
            }
            if (!moment.isMoment(date)) {
              formattedDate = moment(date);
              return formattedDate.isValid() ? formattedDate.format(format) : opts.locale.invalidLabel;
            } else {
              return date.format(format);
            }
          };

          // transforms date model for input display
          _formatInput = function (objValue) {
            var f,
              formattedDate;

            if (objValue) {
              if (opts.singleDateAndTime && opts.timePicker && objValue.startDate) {
                return _formatterHelper(objValue.startDate);
              } else if ((opts.singleDateAndTime && objValue.startDate) || opts.singleDatePicker || (moment.isMoment(objValue.startDate) && moment.isMoment(objValue.endDate) && objValue.startDate.isSame(objValue.endDate, 'day') && !_picker.timePicker)) {
                return _formatterHelper(objValue.startDate, opts.locale.formatDate);
              } else {
                return objValue.startDate || objValue.endDate ? [
                  _formatterHelper(objValue.startDate),
                  _formatterHelper(objValue.endDate)
                ].join(opts.locale.separator) : '';;
              }
            } else {
              return '';
            }
          };

          // sets input value after transformation to string
          _setDateInputValue = function (objValue) {
            var value;
            value = _formatInput(objValue);
            element.val(value);
          };

          // updates UI after model changes
          modelCtrl.$render = function () {
            // set startDate/endDate
            if (modelCtrl.$viewValue) {
              _setStartDate(modelCtrl.$viewValue.startDate);
              _setEndDate(modelCtrl.$viewValue.endDate);
            } else {
              _clear();
            }

            // update input with date as string
            _setDateInputValue(modelCtrl.$viewValue);
          };

          modelCtrl.$isEmpty = function (val) {
            return !(angular.isString(val) && val.length > 0);
          };

          function read() {
            var newVal = {
              startDate: _picker.startDate && _picker.startDate.unix ? _picker.startDate.unix() * 1000 : null,
              endDate: _picker.endDate && _picker.endDate.unix ? _picker.endDate.unix() * 1000 : null,
              dateRangeTypeId: _picker.chosenDateRangeTypeId
            }

            // update viewValue when closing datepicker
            modelCtrl.$setViewValue(newVal);
            _setDateInputValue(newVal)
          }

          _init = function () {
            var eventType, _results, wrapEl;

            // options to process (one time setup, no watchers)
            // min, max opts, clearable

            // TODO: minDate, maxDate should be just part of options; no need to pass them as separate params
            opts.minDate = $scope.min ? moment($scope.min) : false;
            opts.maxDate = $scope.max ? moment($scope.max) : false;
            opts = _mergeOpts(opts, $scope.opts);

            if ($scope.clearable) {
              opts = _mergeOpts(opts, {
                locale: {
                  cancelLabel: opts.clearLabel
                }
              });

              element.on('cancel.daterangepicker', _setDateInputValue.bind(this, {
                startDate: null,
                endDate: null
              }));
            }

            element.daterangepicker(angular.extend(opts, {
              autoUpdateInput: false
            }), function (start, end) {
              return _setDateInputValue({
                startDate: start,
                endDate: end
              });
            });

            _picker = element.data('daterangepicker');

            element.on('hide.daterangepicker', read);

            if (opts.eventHandlers) {
              _results = Object.keys(opts.eventHandlers)
                .map(function(eventType) {
                  return element.on(eventType, function (e) {
                    var eventName = e.type + '.' + e.namespace;
                    return $scope.$evalAsync(opts.eventHandlers[eventName]);
                  });
                });
            }

            return _results;
          };

          _init();

          return $scope.$on('$destroy', function () {
            _picker != null ? _picker.remove() : void 0;
          });
        }
      };
    }
  ]);

}).call(this);

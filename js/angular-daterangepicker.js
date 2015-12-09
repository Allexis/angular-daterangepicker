(function() {
  var picker;

  picker = angular.module('daterangepicker', []);

  picker.constant('dateRangePickerConfig', {
    clearLabel: 'Clear',
    locale: {
      separator: ' - ',
      format: 'YYYY-MM-DD',
      invalidLabel: 'Infinite'
    }
  });

  picker.directive('dateRangePicker', ['$compile', '$timeout', '$parse', 'dateRangePickerConfig', function($compile, $timeout, $parse, dateRangePickerConfig) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        min: '=',
        max: '=',
        model: '=ngModel',
        opts: '=options',
        clearable: '=',
        hidePredefinedRanges: '=',
        time: '='
      },
      link: function($scope, element, attrs, modelCtrl) {
        var customOpts, el, opts, _clear, _format, _init, _initBoundaryField, _mergeOpts, _picker, _setDatePoint, _setEndDate, _setStartDate, _setViewValue, _validate, _validateMax, _validateMin;

        _mergeOpts = function() {
          var extend, localeExtend;
          localeExtend = angular.extend.apply(angular, Array.prototype.slice.call(arguments).map(function(opt) {
            return opt != null ? opt.locale : void 0;
          }).filter(function(opt) {
            return !!opt;
          }));
          extend = angular.extend.apply(angular, arguments);
          extend.locale = localeExtend;
          return extend;
        };
        el = $(element);

        customOpts = $scope.opts;
        opts = _mergeOpts({}, dateRangePickerConfig, customOpts);

        if($scope.time){
          opts.timePicker = true;
        }

        if(!$scope.hidePredefinedRanges){
          opts.ranges = {
            'today': {0: moment().startOf('day'), 1: moment().endOf('day'), displayName: 'Today'},
            'yesterday': {0: moment().subtract(1, 'days').startOf('day'), 1: moment().subtract(1, 'days').endOf('day'), displayName: 'Yesterday'},
            'last7days': {0: moment().subtract(6, 'days').startOf('day'), 1: moment().endOf('day'), displayName: 'Last 7 days'},
            'next7days': {0: moment().startOf('day'), 1: moment().add(6, 'days').endOf('day'), displayName: 'Next 7 days'},
            'after_date': {0: moment().startOf('day'), 1: null, displayName: 'After the date'},
            'before_date': {0: null, 1: moment().endOf('day'), displayName: 'Before the date'},
            'specific_date': {0: moment().startOf('day'), 1: moment().endOf('day'), displayName: 'Specific date'},
          }
        }

        _picker = null;
        _clear = function() {
          _picker.setStartDate();
          return _picker.setEndDate();
        };
        _setDatePoint = function(setter) {
          return function(newValue) {
            if (_picker && newValue) {
              return setter(moment(newValue));
            }
          };
        };
        _setStartDate = _setDatePoint(function(m) {

          if (_picker.endDate < m) {
            //_picker.setEndDate(m);
          }
          //return _picker.setStartDate(m);
        });
        _setEndDate = _setDatePoint(function(m) {

          if (_picker.startDate > m) {
            //_picker.setStartDate(m);
          }
          return //_picker.setEndDate(m);
        });
        _format = function(objValue) {
          var f, 
            formattedDate;

          f = function(date) {
            if (!moment.isMoment(date)) {
              formattedDate = moment(date);
              return formattedDate.isValid() ? formattedDate.format(opts.locale.format) : opts.locale.invalidLabel;
            } else {
              return date.format(opts.locale.format);
            }
          };

          if (objValue) {
            if (opts.singleDatePicker || (moment.isMoment(objValue.startDate) && moment.isMoment(objValue.endDate) && objValue.startDate.isSame(objValue.endDate,'day') ) ) {
              return f(objValue.startDate);
            } else {
              return [f(objValue.startDate), f(objValue.endDate)].join(opts.locale.separator);
            }
          } else {
            return '';
          }
        };
        _setViewValue = function(objValue) {
          var value;

          value = _format(objValue);
          el.val(value);
          return modelCtrl.$setViewValue(value);
        };
        _validate = function(validator) {
          return function(boundary, actual) {
            if (boundary && actual) {
              return validator(moment(boundary), moment(actual));
            } else {
              return true;
            }
          };
        };
        _validateMin = _validate(function(min, start) {
          return min.isBefore(start) || min.isSame(start, 'day');
        });
        _validateMax = _validate(function(max, end) {
          return max.isAfter(end) || max.isSame(end, 'day');
        });
        modelCtrl.$formatters.push(_format);
        modelCtrl.$render = function() {
          if (modelCtrl.$modelValue && modelCtrl.$modelValue.startDate) {
            _setStartDate(modelCtrl.$modelValue.startDate);
            _setEndDate(modelCtrl.$modelValue.endDate);
          } else {
            _clear();
          }
          return el.val(modelCtrl.$viewValue);
        };
        
        modelCtrl.$parsers.push(function(val) {

          return {
              'startDate': _picker.startDate,
              'endDate': _picker.endDate
            }

        });
        
        modelCtrl.$isEmpty = function(val) {
          return !(angular.isString(val) && val.length > 0);
        };
        _init = function() {
          var eventType, _results;
          el.daterangepicker(angular.extend(opts, {
            autoUpdateInput: false
          }), function(start, end) {
            return _setViewValue({
              startDate: start,
              endDate: end
            });
          });
          _picker = el.data('daterangepicker');

          $(_picker.element).on('hide.daterangepicker', function(){

            $scope.model = {
              'startDate': _picker.startDate,
              'endDate': _picker.endDate
            }

            // trigger parsers
            angular.forEach(modelCtrl.$parsers, function (parser) {
                parser();
            });

            $scope.$apply();

          });

          _results = [];
          for (eventType in opts.eventHandlers) {
            _results.push(el.on(eventType, function(e) {
              var eventName;
              eventName = e.type + '.' + e.namespace;
              return $scope.$evalAsync(opts.eventHandlers[eventName]);
            }));
          }
          return _results;
        };
        _init();
        $scope.$watch('model.startDate', function(n) {
          _setStartDate(n);
          return _setViewValue($scope.model);
        });
        $scope.$watch('model.endDate', function(n) {
          _setEndDate(n);
          return _setViewValue($scope.model);
        });
        _initBoundaryField = function(field, validator, modelField, optName) {
          if (attrs[field]) {
            modelCtrl.$validators[field] = function(value) {
              return value && validator(opts[optName], value[modelField]);
            };
            return $scope.$watch(field, function(date) {
              opts[optName] = date ? moment(date) : false;
              return _init();
            });
          }
        };
        _initBoundaryField('min', _validateMin, 'startDate', 'minDate');
        _initBoundaryField('max', _validateMax, 'endDate', 'maxDate');
        if (attrs.options) {
          $scope.$watch('opts', function(newOpts) {
            opts = _mergeOpts(opts, newOpts);
            return _init();
          }, true);
        }
        if (attrs.clearable) {
          $scope.$watch('clearable', function(newClearable) {
            if (newClearable) {
              opts = _mergeOpts(opts, {
                locale: {
                  cancelLabel: opts.clearLabel
                }
              });
            }
            _init();
            return el.on('cancel.daterangepicker', (newClearable ? _setViewValue.bind(this, {
              startDate: null,
              endDate: null
            }) : null));
          });
        }
        return $scope.$on('$destroy', function() {
          return _picker != null ? _picker.remove() : void 0;
        });
      }
    };
  }]);

}).call(this);

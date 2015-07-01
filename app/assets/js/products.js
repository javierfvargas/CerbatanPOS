'use strict';

require(['jquery', 'angular'], function ($, angular) {
    function Brand(name) {
        this.id = null;
        this.name = name;
    }

    function Tag(name) {
        this.id;
        this.name = name;
    }

    function Tax(name, percentage) {
        this.id = null;
        this.name = name;
        this.percentage = percentage;
    }

    function Fraction(name, sku) {
        this.id = null;
        this.name = name;
        this.sku = sku;
    }

    function Product() {
        this.id = null;
        this.sku = null;
        this.name = null;
        this.brand = null;
        this.tags = [];
        this.cost = null;
        this.markup = null;
        this.price = null;
        this.tax = null;
        this.retailPrice = null;
        this.trackStock = true;
        this.stockCount = null;
        this.alertStockLowLevel = false;
        this.stockAlertLevel = null;
        this.fractions = [];
    }

    angular.module('app.products', ['ngSanitize', 'ngTagsInput', 'ui.select', 'play.routing', 'app.common'])
        .factory('ProductsSrv', function () {

            return {
                getBrands: function (filter) {

                }
            };
        })

        .controller('ProductsCtrl', ['$scope', '$location', function ($scope, $location) {
            $scope.goToAddProduct = function () {
                $location.path('/product/new');
            };
        }])

        .controller('NewProductCtrl', ['$scope', '$filter', '$cacheFactory', '$log', '$modal', 'playRoutes', function ($scope, $filter, $cacheFactory, $log, $modal, routes) {
            function showAddBrandDialog(brandName, showInput) {
                var modalInstance = $modal.open({
                    templateUrl: "addBrandModal.html",
                    controller: 'NewBrandModalCtrl',
                    resolve: {
                        newBrandName: function () {
                            return brandName;
                        },
                        showInput: function(){
                            return showInput === true;
                        }
                    }
                });

                return modalInstance;
            }

            $scope.product = new Product();

            var lastSearch = " ";
            $scope.brands = [];
            $scope.tags = [];

            $scope.refreshBrands = function (filter) {
                if ((lastSearch.length === 0 && filter.length > 0) || filter.toLowerCase().indexOf(lastSearch.toLocaleLowerCase()) !== 0) {
                    lastSearch = filter;
                    routes.controllers.products.Products.brands(filter).get().success(function (brands) {
                        if (brands.length === 0) {
                            brands.push(new Brand(filter));
                        }

                        $scope.brands = brands;
                    })
                } else if ( this.$select.items.length === 0 || this.$select.items[0].id == null ) {
                    if ( this.$select.items.length > 1 && this.$select.items[0].id == null ){
                        $scope.brands.shift();
                    } else if ($scope.brands.length > 0 && $scope.brands[0].id == null)
                        $scope.brands[0].name = filter;
                    else
                        $scope.brands.unshift(new Brand(filter));
                }
            };

            $scope.brandSelected = function (select) {
                if (select.search) {
                    if (!select.selected || select.selected.id == null || select.selected.name.toLowerCase().indexOf(select.search.toLocaleLowerCase()) === -1) {
                        var newBrandName = select.search;
                        showAddBrandDialog(newBrandName).result.then(
                            function () {
                                $log.info("Adding Brand");
                                routes.controllers.products.Products.addBrand().put({name: newBrandName})
                                    .success(function (brand) {
                                        $scope.product.brand = brand;
                                    })
                                    .error(function () {
                                        $log.warning("Failed brand creation");
                                    });
                            },
                            function () {
                                select.selected = null;
                            }
                        );
                    }
                }

                select.search = '';
            };

            $scope.addBrand = function(){
                showAddBrandDialog("", true).result.then(
                    function (newBrandName) {
                        $log.info("Adding Brand");
                        routes.controllers.products.Products.addBrand().put({name: newBrandName})
                            .success(function (brand) {
                                $scope.product.brand = brand;
                            })
                            .error(function () {
                                $log.warning("Failed brand creation");
                            });
                    },
                    function () {

                    }
                );
            };

            $scope.loadTags = function($query) {
                return routes.controllers.products.Products.tags().get({ cache: true}).then(function(response) {
                    return $filter('filter')(response.data, $query);
                });
            };

            $scope.handleAddingTag = function($tag){
                if ( $tag.id == undefined || $tag.id == null ){
                    $log.info("Adding Tag");
                    routes.controllers.products.Products.addTag().put({name: $tag.name})
                        .success(function (tag) {
                            $scope.product.tags.pop();
                            $scope.product.tags.push(tag);
                            $cacheFactory.get('$http').remove(routes.controllers.products.Products.tags().url);
                        })
                        .error(function () {
                            $scope.product.tags.pop();
                            $log.warning("Failed tag creation");
                        });
                }
            };

            $scope.$watch('product.cost', function () {
                $scope.product.price = $scope.product.cost*(1.0 + $scope.product.markup/100.0);
            });

            $scope.$watch('product.markup', function () {
                var newPrice = $scope.product.cost*(1.0 + $scope.product.markup/100.0);
                if ( $scope.product.price !== newPrice ){
                    $scope.product.price = newPrice;
                }
            });

            $scope.$watch('product.price', function () {
                var newMarkup = ($scope.product.price/$scope.product.cost-1.0)*100.0;
                if ( newMarkup !== $scope.product.markup ){
                    $scope.product.markup = newMarkup;
                }
            });

        }])

        .controller('NewBrandModalCtrl', ['$scope', '$log', '$modalInstance', 'newBrandName', 'showInput', function ($scope, $log, $modalInstance, newBrandName, showInput) {
            $scope.newBrandName = newBrandName;
            $scope.showInput = showInput;
            $scope.disableSave = showInput;
            $scope.inputChange = function(){
                $scope.disableSave = ($scope.newBrandName.length <= 1);
            };
            $scope.ok = function () {
                $modalInstance.close($scope.newBrandName);
            };

            $scope.cancel = function () {
                $modalInstance.dismiss();
            };
        }]);
});

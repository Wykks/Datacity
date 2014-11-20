(function() {
	angular
		.module('app')
		.controller('datasetWizardController' , ['$scope',
			function($scope) {
				$scope.continueButton = null;
				$scope.backButton = null;
				$scope.endButton = null;
				$scope.canContinue = function(){return false};
				$scope.sourceData = null;
			}])
		.controller('datasetWizardStep1Controller', ['$scope', '$upload', '$http', '$timeout', '$q', '$state', '$modal', '$filter', 'ngTableParams',
			function($scope, $upload, $http, $timeout, $q, $state, $modal, $filter, ngTableParams) {
				$scope.fileUp = [];
				$scope.filesData = [];
				$scope.combinedColumns = [];
				$scope.$parent.wizardProgress = 15;
				$scope.$parent.step = '1';
				$scope.$parent.backButton = null;

				$scope.bytesToSize = function(bytes) {
				   if (bytes == 0) return '0 Octet';
				   var k = 1000;
				   var sizes = ['Octets', 'Kio', 'Mio', 'Gio'];
				   var i = Math.floor(Math.log(bytes) / Math.log(k));
				   return { value:(bytes / Math.pow(k, i)).toPrecision(3), m:sizes[i] };
				}

				function alreadyExist(fileName) {
					for(var i = 0, len = $scope.fileUp.length; i < len; i++) {
					    if ($scope.fileUp[i].data.name === fileName) {
					        return true;
					    }
					}
					return false;
				}

				function uploadFile(file) {
					$upload.upload({
						url: 'http://localhost:4567/users/delkje555/files/add',
						method: 'POST',
						file: file.data,
						ignoreLoadingBar: true,
						timeout: file.canceller.promise
					}).success(function(data, status, headers, config) {
						//CE TIMEOUT/GET EST TEMPORAIRE, POUR FONCTIONNER AVEC LA VERSION COURANTE DE L'API
						$timeout(function() {
							$http(
							{
								method: 'GET',
								ignoreLoadingBar: true,
								url: 'http://localhost:4567/users/delkje555/files/' + data.data.files[0].path + '/parse'
							}).success(function(response) {
								regroupAndAddFileData(response.data, file);
								file.status = -1;
							}).error(function(data, status, headers, config) {
								file.status = status;
							});
						}, 1000);

					}).error(function(data, status, headers, config) {
						file.status = status;
					}).progress(function(evt) {
						file.progress = parseInt(100.0 * evt.loaded / evt.total);
					});
				}

				function addTwoFileCombi(combinedColumn, currentCol, fileNameNew, fileNameOld) {
					combinedColumn.push({fileName: fileNameNew, column: currentCol});
					for(var i = 0, len = combinedColumn.length; i < len; i++) {
						if (combinedColumn[i].fileName === fileNameOld)
							return;
					}
					combinedColumn.push({fileName: fileNameOld, column: currentCol});
				}

				function addNewCombiToCurrentCombi(currentCol, fileNameNew, fileNameOld) {
					for(var k = 0, len = $scope.combinedColumns.length; k < len; k++) {
						for(var p = 0, leni = $scope.combinedColumns[k].length; p < leni; p++) {
							if ($scope.combinedColumns[k][p].column === currentCol) {
								addTwoFileCombi($scope.combinedColumns[k], currentCol, fileNameNew, fileNameOld);
								return true;
							}
						}
					}
					return false;
				}

				function regroupAndAddFileData(data, file) {
					var currColumns = Object.keys(data[0]);
					for (var i = 0, len = $scope.filesData.length; i < len; i++) {
						var combi = $scope.filesData[i].columns.filter(function (val) {
							for(var j = 0, leni = currColumns.length; j < leni; j++) {
							    if (currColumns[j] === val) {
							        return true;
							    }
							    return false;
							}
						});
						for(var j = 0, lene = combi.length; j < lene; j++) {
							if (addNewCombiToCurrentCombi(combi[j], file.data.name, $scope.filesData[i].fileName))
								break;
							$scope.combinedColumns.push([{fileName: file.data.name, column: combi[j]},
														{fileName: $scope.filesData[i].fileName, column: combi[j]}]);
						}
					}
					$scope.filesData.push({
						fileName: file.data.name,
						columns: currColumns,
						datas: data
					});
				}

				$scope.onFileSelect = function($files) {
				    for (var i = 0; i < $files.length; i++) {
				    	if (alreadyExist($files[i].name))
				    		break;
						var file = {data: $files[i], progress: 0, status: -2, canceller: $q.defer()};
						$scope.fileUp.push(file);
						uploadFile(file);
					}
				};

				$scope.dragOverClass = function($event) {
					var items = $event.dataTransfer.items;
					var hasFile = false;
					if (items != null) {
						for (var i = 0 ; i < items.length; i++) {
							if (items[i].kind == 'file') {
								hasFile = true;
								break;
							}
						}
					} else {
						hasFile = true;
					}
					return hasFile ? "dragover" : "dragover-err";
				};

				$scope.removeFile = function($index) {
					for(var i = 0, len = $scope.filesData.length; i < len; i++) {
					    if ($scope.filesData[i].fileName === $scope.fileUp[$index].data.name) {
					        $scope.filesData.splice(i, 1);
					        break;
					    }
					}
					for (var i = $scope.combinedColumns.length - 1; i >= 0; i--) {
						$scope.combinedColumns[i] = $scope.combinedColumns[i].filter(function (val) {
							return val.fileName !== $scope.fileUp[$index].data.name;
						});
						if ($scope.combinedColumns[i].length === 0)
							$scope.combinedColumns.splice(i, 1);
					};
					$scope.fileUp.splice($index, 1);
				};

				$scope.abortUpload = function($index) {
					$scope.fileUp[$index].canceller.resolve();
					$scope.fileUp.splice($index, 1);
				};

				$scope.removeAllFile = function() {
					$scope.fileUp.map(function (item) { item.canceller.resolve() });
					$scope.fileUp = [];
					$scope.combinedColumns = [];
					$scope.filesData = [];
				};

				function checkIfAllCombined() {
					var fileList = [];
					for (var i = 0, len = $scope.combinedColumns.length; i < len; i++) {
						for (var j = 0, lenn = $scope.combinedColumns[i].length; j < lenn; j++) {
							if (fileList.indexOf($scope.combinedColumns[i][j].fileName) === -1) {
						        fileList.push($scope.combinedColumns[i][j].fileName);
						    }
						}
					}
					if (fileList.length !== $scope.filesData.length) {
						var str = "";
						for (var i = fileList.length === 0 ? 1 : 0, len = $scope.filesData.length; i < len; i++) {
							if (fileList.indexOf($scope.filesData[i].fileName) === -1) {
								str += '<li>' + $scope.filesData[i].fileName +'</li>';
							}
						}
						$modal({content: str,
								template: 'datasetWizardConfirmStep1Modal.html',
								placement: 'center',
								scope: $scope,
								animation: 'am-fade-and-scale',
								show: true});
						return false;
					}
					return true;
				}

				function combineFilesAndShow() {
					$scope.$parent.canContinue = function(){return false};
					$scope.combinedColumns = $scope.combinedColumns.filter(function (item) {
						return item.length > 1;
					});
					if ($scope.combinedColumns.length === 0) {
						takeFirstFileAndGo();
						return;
					}
					for (var i = 0, len = $scope.combinedColumns.length; i < len; i++) {

					}

					$scope.$parent.sourceData = $scope.filesData[0]; //TMP
					$state.go('wizardDS.step2');
				};

				function takeFirstFileAndGo() {
					$scope.$parent.sourceData = $scope.filesData[0];
					$state.go('wizardDS.step2');
				}

				$scope.continueModal = function(hide) {
					hide();
					$timeout(combineFilesAndShow, 100);
				};

				$scope.$parent.continueButton = function() {
					if ($scope.$parent.sourceData) {
						$state.go('wizardDS.step2');
						return;
					}
					if ($scope.filesData.length === 1) {
						takeFirstFileAndGo();
						return;
					}
					if (!checkIfAllCombined())
						return;
					combineFilesAndShow();
				};

				$scope.$parent.canContinue = function() {
					return $scope.filesData.length > 0;
				};

				$scope.droppedRegroup = function(evt, data) {
					for (var i = $scope.combinedColumns.length - 1; i >= 0; i--) {
						$scope.combinedColumns[i] = $scope.combinedColumns[i].filter(function (val) {
							return !(val.fileName === data.fileName &&
								val.column === data.column);
						});
						if ($scope.combinedColumns[i].length === 0)
							$scope.combinedColumns.splice(i, 1);
					};
					$scope.combinedColumns.push([data]);
				};

				$scope.droppedTableRegroup = function(evt, data, index) {
					for (var i = $scope.combinedColumns.length - 1; i >= 0; i--) {
						if (i === index) {
							for (var j = $scope.combinedColumns[i].length - 1; j >= 0; j--) {
								if ($scope.combinedColumns[i][j].fileName === data.fileName) {
									$scope.combinedColumns[i].splice(j, 1);
									break;
								}
							}
							$scope.combinedColumns[i].push(data);
							continue;
						}
						$scope.combinedColumns[i] = $scope.combinedColumns[i].filter(function (val) {
							return !(val.fileName === data.fileName &&
								val.column === data.column);
						});
						if ($scope.combinedColumns[i].length === 0)
							$scope.combinedColumns.splice(i, 1);
					};
				}
			}])
		.controller('datasetWizardStep2Controller', ['$scope', '$state', '$filter', 'ngTableParams',
			function($scope, $state, $filter, ngTableParams) {
				if (!$scope.$parent.sourceData) {
					$state.go('wizardDS.step1');
				}
				$scope.$parent.wizardProgress = 40;
				$scope.$parent.step = '2';
				$scope.$parent.backButton = function() {
					$scope.$parent.sourceData = null;
					$state.go('wizardDS.step1');
				};
				$scope.$parent.continueButton = function() { $state.go('wizardDS.step3') };
				$scope.$parent.canContinue = function() { return true; };

			    $scope.tableParams = new ngTableParams({
			        page: 1,
			        count: 10
			    }, {
			        total: $scope.$parent.sourceData.datas.length,
			        getData: function($defer, params) {
			            var filteredData = params.filter() ?
			                    $filter('filter')($scope.$parent.sourceData.datas, params.filter()) :
			                    $scope.$parent.sourceData.datas;
			            var orderedData = params.sorting() ?
			                    $filter('orderBy')(filteredData, params.orderBy()) :
			                    $scope.$parent.sourceData.datas;

			            params.total(orderedData.length);
			            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			        }
			    });

			    $scope.sortTable = function(name) {
			    	var obj = {};
			    	obj[name] = $scope.tableParams.isSortBy(name, 'asc') ? 'desc' : 'asc';
			    	$scope.tableParams.sorting(obj);
			    }

			    $scope.filterTable = function(name) {
			    	var obj = {};
			    	obj[name] = 'text';
			    	return obj;
			    }

			    $scope.addColModal = {
				  "title": "Ajout d'une colonne",
				  "content": "TODO"
				};
			}])
		.controller('datasetWizardStep3Controller', ['$scope', '$state', '$modal',
			function($scope, $state, $modal) {
				if (!$scope.$parent.sourceData) {
					$state.go('wizardDS.step1');
				}
				$scope.$parent.wizardProgress = 60;
				$scope.$parent.step = '3';
				$scope.$parent.backButton = function() {
					$scope.$parent.sourceDataFinal = null;
					$state.go('wizardDS.step2');
				};
				$scope.$parent.canContinue = function() {
					return $scope.finalColumns.length > 0;
				};

				$scope.finalColumns = [];

				$scope.tryAddColumn = function(evt, data) {
					$scope.currentCol = data;
					$scope.currentIndex = -1; //Workaround pour passer facilement l'index...
					$modal({template: 'datasetWizardRenameColStep3Modal.html',
						placement: 'center',
						content: data,
						scope: $scope,
						animation: '',
						show: true});
				};

				$scope.confirmRenameModal = function(hide, currentColTitle) {
					c = currentColTitle.toString();
					if (c === "")
						return;
					hide();
					if ($scope.currentIndex === -1)
						$scope.addColumn(c);
					else
						$scope.renameColTitle(c);
				}

				$scope.addColumn = function(currentColTitle) {
					for (var i = $scope.finalColumns.length - 1; i >= 0; i--) {
						$scope.finalColumns[i].oldColumns = $scope.finalColumns[i].oldColumns.filter(function (val) {
							return val !== $scope.currentCol;
						});
						if ($scope.finalColumns[i].oldColumns.length === 0)
							$scope.finalColumns.splice(i, 1);
					};
					$scope.finalColumns.push({title: currentColTitle, oldColumns: [$scope.currentCol]});
				}

				$scope.combineColumn = function(evt, data, index) {
					for (var i = $scope.finalColumns.length - 1; i >= 0; i--) {
						$scope.finalColumns[i].oldColumns = $scope.finalColumns[i].oldColumns.filter(function (val) {
							return val !== data;
						});
						if (i === index) {
							$scope.finalColumns[index].oldColumns.push(data);
							continue;
						}
						if ($scope.finalColumns[i].oldColumns.length === 0)
							$scope.finalColumns.splice(i, 1);
					};
				};

				$scope.tryCopyCol = function() {
					if ($scope.finalColumns.length > 0) {
						$modal({template: 'datasetWizardCopyColStep3Modal.html',
							placement: 'center',
							scope: $scope,
							animation: '',
							show: true});
					}
					else
						$scope.copyCol();
				};

				$scope.copyCol = function(hide) {
					if (hide)
						hide();
					$scope.finalColumns = $scope.$parent.sourceData.columns.map(function(item) {
						return {title: item, oldColumns: [item]};
					});
				}

				$scope.removeAllCol = function() {
					$scope.finalColumns = [];
				};

				$scope.editColTitle = function(index) {
					$scope.currentIndex = index;
					$modal({template: 'datasetWizardRenameColStep3Modal.html',
						placement: 'center',
						content: $scope.finalColumns[index].title,
						scope: $scope,
						animation: '',
						show: true});
				};

				$scope.renameColTitle = function(newTitle) {
					$scope.finalColumns[$scope.currentIndex].title = newTitle;
				}

				$scope.removeCol = function(index) {
					$scope.finalColumns.splice(index, 1);
				};

				function subPrepareNewColumnName(item) {
					for (var i = 0, len = $scope.finalColumns.length; i < len; i++) {
						for (var j = 0, lenn = $scope.finalColumns[i].oldColumns.length; j < lenn; j++) {
							if (item === $scope.finalColumns[i].oldColumns[j])
								return {oldName: item, title: $scope.finalColumns[i].title }
						}
					}
					return false;
				}

				function prepareNewColumnName() {
					var newColumnName = [];
					for (var k = 0, len = $scope.$parent.sourceData.columns.length; k < len; k++) {
						var tmp = subPrepareNewColumnName($scope.$parent.sourceData.columns[k]);
						if (tmp)
							newColumnName.push(tmp);
					};
					return newColumnName;
				}

				function processNewColumns(newColumnsNames) {
					$scope.$parent.sourceDataFinal = $scope.$parent.sourceData.datas.map(function(line) {
						var newLine = {};
						for (i = 0, len = newColumnsNames.length; i < len; i++) {
							if (newLine[newColumnsNames[i].title])
								newLine[newColumnsNames[i].title] = newLine[newColumnsNames[i].title] +
																" " + line[newColumnsNames[i].oldName];
																//TODO support de differents separateurs
							else
								newLine[newColumnsNames[i].title] = line[newColumnsNames[i].oldName];
						}
						return newLine;
					});
				}

				$scope.$parent.continueButton = function() {
					var newColumnsNames = prepareNewColumnName();
					//TODO Check ici si identique
					processNewColumns(newColumnsNames);
					$state.go('wizardDS.step4');
				};
			}])
		.controller('datasetWizardStep4Controller', ['$scope', '$state', 'filterList', '$http',
			function($scope, $state, filterList, $http) {
				if (!$scope.$parent.sourceDataFinal) {
					$state.go('wizardDS.step1');
				}
				$scope.$parent.wizardProgress = 80;
				$scope.$parent.step = '4';
				$scope.$parent.backButton = function() { $state.go('wizardDS.step3'); };
				$scope.$parent.continueButton = function() { $state.go('wizardDS.step5') };
				$scope.$parent.canContinue = function() {
					return true; //FIXME VERIFIER LES CHAMPS REQUIS !
				};
				$scope.$parent.endButton = null;

				$scope.filterList = filterList.data.results;
				$scope.dvisibility = ['Autoriser tout le monde à voir mes publications',
					'Autoriser mes abonnés/abonnements à voir mes publications',
					'N\'autoriser personne à voir mes publications'];
			    $scope.getLocation = function(val) {
			    	if (!val)
			    		return null;
					return $http.get(Routing.generate('datacity_public_api_place'), {
                		ignoreLoadingBar: true,
                		params: {
                    		q: val
                		}}).then(function(res) {
                			return res.data.results.map(function(item) { return item.name });
                	});
			    }
			}])
		.controller('datasetWizardStep5Controller', ['$scope', '$state', '$filter', 'ngTableParams', 'DatasetFactory', '$http',
			function($scope, $state, $filter, ngTableParams, DatasetFactory, $http) {
				if (!$scope.$parent.sourceDataFinal) {
					$state.go('wizardDS.step1');
				}
				$scope.$parent.wizardProgress = 100;
				$scope.$parent.step = '5';
				$scope.$parent.backButton = null;
				$scope.$parent.continueButton = null;

				$scope.sourceDataFinalColumns = Object.keys($scope.$parent.sourceDataFinal[0]);

			    $scope.tableParams = new ngTableParams({
			        page: 1,
			        count: 10
			    }, {
			        total: $scope.$parent.sourceDataFinal.length,
			        getData: function($defer, params) {
			            var filteredData = params.filter() ?
			                    $filter('filter')($scope.$parent.sourceDataFinal, params.filter()) :
			                    $scope.$parent.sourceDataFinal;
			            var orderedData = params.sorting() ?
			                    $filter('orderBy')(filteredData, params.orderBy()) :
			                    $scope.$parent.sourceDataFinal;

			            params.total(orderedData.length);
			            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
			        }
			    });

			    $scope.sortTable = function(name) {
			    	var obj = {};
			    	obj[name] = $scope.tableParams.isSortBy(name, 'asc') ? 'desc' : 'asc';
			    	$scope.tableParams.sorting(obj);
			    }

			    $scope.filterTable = function(name) {
			    	var obj = {};
			    	obj[name] = 'text';
			    	return obj;
			    }

				$scope.$parent.endButton = function() {
					$state.go('datasetList');
				};

				$scope.$parent.canEnd = false;
				DatasetFactory.post($scope.$parent.meta.dataset).then(function(data) {
					$scope.datasetLink = Routing.generate('datacity_public_dataviewpage') + '#/dataset/' + data.result;
					var sourceSlug = $scope.$parent.meta.source.title.replace(/[^a-zA-Z0-9\s]/g,"").toLowerCase().replace(/\s/g,'-');
					//TRICK pour l'ancienne API
					var databinding = $scope.sourceDataFinalColumns.map(function(item) {
						return { from: item, to: item };
					});
					//ENDTRICK
					$http({
						method: 'POST',
						contentType: false,
        				processData: false,
        				data: {databinding: databinding,
        					jsonData: $scope.$parent.sourceDataFinal},
						url: 'http://localhost:4567/users/dlkjdlkjjd/dataset/' + data.result + '/source/' + sourceSlug + '/upload'
					}).then(function(response) {
						//TODO Support d'erreur
						var tmp = {metadata: $scope.$parent.meta.source,
								dataModel: $scope.sourceDataFinalColumns.map(function(item) {
									return {name: item, type: "Texte"};
								})}
						$http.post(Routing.generate('datacity_private_source_post', {slug: data.result}), tmp).then(function() {
							$scope.$parent.canEnd = true;
						});
					});
				});
			}])
})();
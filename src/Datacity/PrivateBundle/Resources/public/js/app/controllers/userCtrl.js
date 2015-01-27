(function() {
	angular
		.module('app')
		.controller('userController', ['$scope', '$stateParams', '$modal', '$log', 'UserFactory', '$state', 'currentUser',
			function($scope, $stateParams, $modal, $log, UserFactory, $state, currentUser) {
				$scope.user = currentUser;
				$scope.passwords = {};
				$scope.userInfos = {
					firstname: currentUser.firstname,
					lastname: currentUser.lastname,
					occupation: currentUser.occupation,
					about: currentUser.about,
					website: currentUser.website,
					newsletter: currentUser.receive_newsletter
				};
				//$scope.template = {};

				//$scope.template.userOverview = Routing.generate('datacity_private_partials', {pageName: 'userOverview'});
				//$scope.template.userFollowed = Routing.generate('datacity_private_partials', {pageName: 'userFollowed'});
				//$scope.template.userFollowers = Routing.generate('datacity_private_partials', {pageName: 'userFollowers'});


				$scope.imageUpload = {};//'http://www.placehold.it/310x170/EFEFEF/AAAAAA&text=no+image';
				var image;
                toastr.options = {
                    "closeButton": true,
                    "debug": false,
                    "positionClass": "toast-top-full-width",
                    "onclick": null,
                    "showDuration": "1000",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                }

                $scope.tabs = [
                    { heading: "Vue d'ensemble", route:"profile.mainView", active:false },
                    { heading: "Paramètres du compte", route:"profile.settings", active:false },
                    { heading: "Information API", route:"profile.api", active:false }
                ];

                $scope.settingsTabs = [
                    { heading: "Modifier Profil", route:"profile.settings.profileSettings", active:false },
                    { heading: "Modifier Avatar", route:"profile.settings.pictureSettings", active:false },
                    { heading: "Modifier mot de passe", route:"profile.settings.passwordSettings", active:false }
                ];

                $scope.go = function(route){
                    $state.go(route);
                };

                $scope.$on("$stateChangeSuccess", function() {
                    $scope.tabs.forEach(function(tab) {
                        tab.active = $state.is(tab.route) || $state.includes(tab.route);
                    });

                    $scope.settingsTabs.forEach(function(settingsTab) {
                        settingsTab.active = $state.is(settingsTab.route);
                    });
                });

				//TODO: A changer en fonction du champ image du user
				// var showImg = function (img) {
		 	// 		var reader = new FileReader();

		  //           reader.onload = function (e) {
		  //               jQuery('#profileImg').attr('src', e.target.result);
		  //           }
		  //           reader.readAsDataURL(img);
				// };

				/*UserFactory.populate().then(function(data) {
					console.log(data);
					$scope.user.datasets = data;
				})*/

				$scope.onImageSelect = function($files) {
      				image = $files[0];
      				if (image) {
			            var reader = new FileReader();

			            reader.onload = function (e) {
			            	jQuery('#thumbnail-preview').attr('src', e.target.result);
			            	//Ne se met pas a jour ...
			            	$scope.imageUpload.img_url = e.target.result;
			            	$scope.imageUpload.img_name = image.name;
			            }
			            reader.readAsDataURL(image);
			        }
			    }

				$scope.deleteImage = function() {
					image = null;
					jQuery('#thumbnail-preview').attr('src', 'http://www.placehold.it/310x170/EFEFEF/AAAAAA&text=no+image');
					//$scope.imageUpload = 'http://www.placehold.it/310x170/EFEFEF/AAAAAA&text=no+image';
				}

			    //TODO: Changer les "Then"
				$scope.uploadImage = function () {
					if (image) {
						// $scope.user.profileImg = $scope.imageUpload;

						UserFactory.uploadImage(image).then(function(data) {

					 		if (data.action == "success") {
					 			//jQuery('#profileImg').attr('src', $scope.imageUpload);
					 			//$scope.user.profileImg = $scope.imageUpload;
					        	//console.log($scope.imageUpload);
					        	toastr.success("Votre nouvel avatar est en ligne !", "Image chargée avec succès");
					        } else {
					        	toastr.error("Merci de contacter un administrateur ou de réessayer ultérieurement", "Une erreur est survenue !");
					        }
					 	});
				 	} else {
				 		//MESSAGE D'ERREUR
                        toastr.error("Merci de contacter un administrateur ou de réessayer ultérieurement", "Une erreur est survenue !");
				 	}
				}

				$scope.updatePassword = function () {
					if ($scope.passwords.newPassword == $scope.passwords.confirmPassword) {
			        	var userPasswords = $scope.passwords;
				        UserFactory.updatePassword(userPasswords).success(function(data) {
                            toastr.success("Utilisez votre nouveau mot de passe à la prochaine connexion", "Mot de passe modifié !");
					 	}).error(function(data) {
					 		toastr.error("Les champs doivent etre complétés. Le nouveau mot de passe et sa vérification doivent être identiques.", "Erreur lors de la vérification du mot de passe");
					 	})
				 	} else {
				 		toastr.error("Les champs doivent etre complétés. Le nouveau mot de passe et sa vérification doivent être identiques.", "Erreur lors de la vérification du mot de passe");
				 	}
			    }

				$scope.updateUser = function () {
			        UserFactory.updateUser($scope.userInfos).then(function(data) {
                        toastr.success("Vos nouvelles informations sont en ligne !", "Profil mis à jour !");
				 	});
			    }
		}]);
})();
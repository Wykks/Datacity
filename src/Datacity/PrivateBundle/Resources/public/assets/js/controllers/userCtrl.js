(function() {
	angular
		.module('app')
		.controller('userController', ['$scope', '$stateParams', '$modal', '$log', 'UserFactory',
			function($scope, $stateParams, $modal, $log, UserFactory) {
				$scope.user = {};
				$scope.passwords = {};
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
				//$scope.imageUpload = 'http://www.placehold.it/310x170/EFEFEF/AAAAAA&text=no+image';
				var image;

				//TODO: A changer en fonction du champ image du user
				var showImg = function (img) {
		 			var reader = new FileReader();

		            reader.onload = function (e) {
		                jQuery('#profileImg').attr('src', e.target.result);
		            }
		            reader.readAsDataURL(img);
				};
				
				 UserFactory.getUserFromSession().then(function(data) {
				 	$scope.user = data;
					$scope.user.datasets = UserFactory.populateDatasetTmp();
				 });
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
			            	//$scope.imageUpload = e.target.result;
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
						$scope.user.img = UserFactory.uploadImage(image).then(function(data) {
							//TODO: A changer en fonction de ce qu'on recevra en retour du controller
							//+ gestion d'erreur et message de validation
                            toastr.success("Votre nouvel avatar est en ligne !", "Image chargée avec succès !");
					 		if (data.config.file) {
					 			showImg(data.config.file);
					        }
					 	});
				 	} else {
				 		//MESSAGE D'ERREUR
                        toastr.error("Merci de contacter un administrateur ou de réessayer ultérieurement", "Une erreur est survenue ! :O");
				 	}
				}

				$scope.updatePassword = function () {
					console.log($scope.passwords);
					if ($scope.passwords.newPassword == $scope.passwords.confirmPassword) {
			        	var userPasswords = $scope.passwords;
                        $scope.passwordChange.pw1.$setValidity("newPassword", true);
                        $scope.passwordChange.pw2.$setValidity("confirmedPassword", true);
				        UserFactory.updatePassword(userPasswords).then(function(data) {
                            toastr.success("Utilisez votre nouveau mot de passe à la prochaine connexion", "Mot de passe modifié !");
					 		console.log(data);
					 	});
				 	} else {
						$scope.passwordChange.pw1.$setValidity("newPassword", false);
                        $scope.passwordChange.pw2.$setValidity("confirmedPassword", false);
				 		toastr.error("Les champs du nouveau mot de passe et de sa vérification doivent être identiques.", "Erreur lors de la vérification du mot de passe");
				 		console.log('error');
				 	}
			    }
				
				$scope.updateUser = function () {
			        var userUpdated = $scope.user;

			        UserFactory.updateUser(userUpdated).then(function(data) {
				 		console.log(data);
                        toastr.success("Vos nouvelles informations sont en ligne !", "Profil mis à jour !");
				 	});
			    }
		}]);
})();
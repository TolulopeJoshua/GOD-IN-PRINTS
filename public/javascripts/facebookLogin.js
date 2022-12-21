
    window.fbAsyncInit = function() {
        FB.init({
          appId            : '658989752467435',
          autoLogAppEvents : true,
          xfbml            : true,
          version          : 'v15.0'
        });
          // FB.getLoginStatus(function(response) {
          //     console.log(response);
          //     FB.logout(function(response) {
          //         deleteCookie("fblo_658989752467435"); // fblo_yourFBAppId. example: fblo_444499089231295
          //     });
  
          //     function deleteCookie(name) {
          //         document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          //     }
          // });
      };
      
    const fbButton = document.querySelector('#fbButton');

    fbButton && fbButton.addEventListener('click', () => {

        swal('Logging in...', {
            buttons: false,
          });

        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                fbLogin(response);
            } else {
                FB.login(function(response){
                    fbLogin(response);
                }, {scope: 'public_profile,email'});
            }
        }) 
    })

    function fbLogin(response) {
        FB.api('/me?fields=name,email', function (res) {

            console.log(res)
            if (!res.authResponse) return swal('Could not retrieve data from Facebook. Please try again later.')
            if (!res.email) return swal('There is no email attached to this Facebook account. Kindly use the Google or Password login.')

            const body = {
                loginType: 'facebook',
                accessToken: response.authResponse.accessToken,
                facebookId: response.authResponse.userID,
                email: res.email,
                firstName: res.name.split(' ')[0] || 'Facebook',
                lastName: res.name.split(' ')[1] || 'User',
                password: '00000000',
            }

            axios.post('/register', body, {
                headers: {'Content-Type': 'application/json'}
            })
            .then(function (response) {
                if (response.data.message === 'success') {
                    console.log(response)
                    return window.location.href = response.data.redirectUrl;
                }
                console.log(response);
                swal("Unable to log in. Kindly try again.");
            })
            .catch(function (error) {
                console.log(error);
                swal("An error occured.");
            });
        })
    }
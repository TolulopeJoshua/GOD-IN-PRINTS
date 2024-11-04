const requestIp = require('request-ip');
const lookup = require('country-code-lookup')
const axios = require('axios').default;

const token = process.env.IP_Token;

module.exports.getUserLocation = async function (req, user) {
    try {
        const clientIp = requestIp.getClientIp(req); // '102.89.76.36'; //
        // console.log(clientIp);
        const url = `https://ipinfo.io/${clientIp}?token=${token}`;
        const location = (await axios.get(url)).data;
        const country = lookup.byInternet(location.country);
        if (location && country && user) {
            user.location = { 
                loc: location.loc,
                city: location.city, 
                localRegion: location.region, 
                countryCode: location.country, 
                country: country.country, 
                region: country.region, 
                continent: country.continent,
            };
            await user.save();
            // console.log(user.location);
        }
    } catch (error) {
        console.log(error);
    }
}

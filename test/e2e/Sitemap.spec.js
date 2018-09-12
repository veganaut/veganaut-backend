'use strict';

var h = require('../helpers_');

h.describe('Sitemap.', function() {
    it('get sitemap.xml', function(done) {
        h.request('GET', h.baseURL + 'sitemap.xml')
            .end(function(err, res) {
                expect(res.statusCode).toBe(200);

                var sitemap = res.text;
                expect(sitemap.indexOf('<?xml version="1.0" encoding="UTF-8"?>')).toBe(0, 'looks like xml');
                expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    'defines a sitemap urlset'
                );
                expect(sitemap).toContain('<loc>https://veganaut.net</loc>', 'url 1');
                expect(sitemap).toContain('<loc>https://veganaut.net/panorama/</loc>', 'url 2');
                expect(sitemap).toContain('<loc>https://veganaut.net/map/</loc>', 'url 3');
                expect(sitemap).toContain('<loc>https://veganaut.net/location/3dosha-6</loc>', 'location 1');
                expect(sitemap).toContain('<loc>https://veganaut.net/location/reformhaus-ruprecht-7</loc>', 'location 2');
                expect(sitemap).toContain('<loc>https://veganaut.net/location/kremoby-hollow-8</loc>', 'location 3');
                expect(sitemap).toContain('<loc>https://veganaut.net/location/shop-9</loc>', 'location 4');

                expect(sitemap).not.toContain('<loc>https://veganaut.net/location/this-place-is-closed-down-11</loc>', 'no deleted location');

                done();
            })
        ;
    });
});

import express from 'express';
// import request from 'request';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();

async function fetchHomeData() {
    const res = (await Promise.all([ // Promise.all zorgt ervoor dat alle fetches tegelijkertijd worden uitgevoerd
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&ps=10`),
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/SK-A-3064/?key=${process.env.API_KEY}`),
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&ps=100`)
    ])).map((res) => res.json());

    const jsonResult = await Promise.all(res).then((data) => { 
        return data;
    });

    return jsonResult;
}

async function fetchCatagoryData(type, material, q) {
    const res = (await Promise.all([
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&ps=50&type=${type}`),
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&ps=50&material=${material}`),
        fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&ps=50&q=${q}`)
    ])).map((res) => res.json());

    const jsonResult = await Promise.all(res).then((data) => {
        return data;
    });

    return jsonResult;
}

async function fetchArtistsData(involvedMaker) {
    try {
        const res = await fetch(`https://www.rijksmuseum.nl/api/nl/collection/?key=${process.env.API_KEY}&involvedMaker=${involvedMaker}`);
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonResult = await res.json();
        return jsonResult;
    } catch (err) {
        console.error('Error fetching data:', err);
        throw err;
    }
}

async function fetchDetailsData(objectNumber) {
    try {
        const res = await fetch(`https://www.rijksmuseum.nl/api/nl/collection/${objectNumber}/?key=${process.env.API_KEY}`);
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonResult = await res.json();
        return jsonResult;
    } catch (err) {
        console.error('Error fetching data:', err);
        throw err;
    }
}

router.get('/', async function(req, res){
    const homeData = await fetchHomeData();
    const heroObject = homeData[1].artObject;
    if(req.session.pageView){
        res.render('main', {layout : 'index', data: homeData[0].artObjects, hero: heroObject})
    } else {
        req.session.pageView = 1;
        res.redirect('/zero-state');
    }
});

router.get('/zero-state', async (req, res) => {
    res.render('zero-state', {layout : 'index'});
})

router.get('/zoeken', async (req, res) => {
    res.render('search', {layout : 'index'});
})

router.post('/zoek-resultaten', async (req, res) => {
    const searchValue = req.body.search;
    const searchData = await fetchCatagoryData(null, null, searchValue);
    const result = searchData[2];
    res.render('search', {layout : 'index', result: result.artObjects});
});

router.get('/categorie/kunstenaars', async (req, res) => {
    const homeData = await fetchHomeData();
    const artists = homeData[2].artObjects.map(artObject => artObject.principalOrFirstMaker);
    const uniqueArtists = [...new Set(artists)];

    const result = uniqueArtists;
    
    console.log(result)

    res.render('artists', {layout : 'index', result: result, category: 'kunstenaars'});
});

router.get('/kunstenaars/:principalOrFirstMaker', async (req, res) => {
    const artistName = req.params.principalOrFirstMaker;
    const artistData = await fetchArtistsData(artistName);
    const result = artistData.artObjects;
    console.log(result);
    res.render('overview-artist', {layout : 'index', result: result, category: artistName});
})

router.get('/type/:type', async (req, res) => {
    const type = req.params.type;
    const categoryData = await fetchCatagoryData(type, null, null);
    const result = categoryData[0].artObjects;

    res.render('category', {layout : 'index', result: result, category: type});
});

router.get('/materiaal/:material', async (req, res) => {
    const material = req.params.material;
    const categoryData = await fetchCatagoryData(null, material, null);
    const result = categoryData[1].artObjects;

    res.render('category', {layout : 'index', result: result, category: material});
});

router.get('/q/:q', async (req, res) => {
    const q = req.params.q;
    const categoryData = await fetchCatagoryData(null, null, q);
    const result = categoryData[2].artObjects;

    res.render('category', {layout : 'index', result: result, category: q});
});

router.get('/details/:objectNumber', async (req, res) => {
    const objectNumberWithPrefix = req.params.objectNumber;
    const objectNumber = objectNumberWithPrefix.replace('nl-', '');
    const detailsData = await fetchDetailsData(objectNumber);
    const result = detailsData.artObject;

    console.log(objectNumber)

    res.render('details', {layout : 'index', result: result});
});

router.get('/offline', (req, res) => {
    res.render('offline', {layout : 'index'});
});

export {router}
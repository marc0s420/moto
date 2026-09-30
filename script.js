const UNINASSAU_COORDS = {
    lat: -3.7770,
    lon: -38.5639
};

const cepInput = document.getElementById('cepInput');
const cepForm = document.getElementById('cepForm');
const cepError = document.getElementById('cepError');

const initialState = document.getElementById('initialState');
const loadingState = document.getElementById('loadingState');
const resultState = document.getElementById('resultState');

const resCep = document.getElementById('resCep');
const resLogradouro = document.getElementById('resLogradouro');
const resBairro = document.getElementById('resBairro');
const resCidadeUf = document.getElementById('resCidadeUf');
const resDistancia = document.getElementById('resDistancia');
const resUberMoto = document.getElementById('resUberMoto');
const resFrete = document.getElementById('resFrete');

cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    e.target.value = value;
});

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

cepForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawCep = cepInput.value.replace(/\D/g, '');

    if (rawCep.length !== 8) {
        cepError.classList.remove('hidden');
        return;
    }

    cepError.classList.add('hidden');
    initialState.classList.add('hidden');
    resultState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
  
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const viaCepData = await viaCepResponse.json();

        if (viaCepData.erro) {
            throw new Error('CEP não encontrado');
        }

        const queryAddress = encodeURIComponent(`${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade} - ${viaCepData.uf}, Brazil`);
        const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryAddress}`);
        const nominatimData = await nominatimResponse.json();

        let destLat = UNINASSAU_COORDS.lat;
        let destLon = UNINASSAU_COORDS.lon;

        if (nominatimData && nominatimData.length > 0) {
            destLat = parseFloat(nominatimData[0].lat);
            destLon = parseFloat(nominatimData[0].lon);
        }


        let distanciaKm = calcularDistanciaKm(UNINASSAU_COORDS.lat, UNINASSAU_COORDS.lon, destLat, destLon) * 1.3;
        

        if (distanciaKm < 1.5) distanciaKm = 1.5;


        const valorUberMoto = 4.50 + (distanciaKm * 1.40);
        
        const valorFrete = 6.00 + (distanciaKm * 1.80);

        resCep.innerText = viaCepData.cep;
        resLogradouro.innerText = viaCepData.logradouro || 'Endereço Geral';
        resBairro.innerText = viaCepData.bairro || 'Centro/Geral';
        resCidadeUf.innerText = `${viaCepData.localidade} / ${viaCepData.uf}`;
        resDistancia.innerText = `${distanciaKm.toFixed(1)} km`;

        resUberMoto.innerText = valorUberMoto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        resFrete.innerText = valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        loadingState.classList.add('hidden');
        resultState.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        loadingState.classList.add('hidden');
        initialState.classList.remove('hidden');
        cepError.classList.remove('hidden');
    }
});
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


const getChineseZodiac = (year) => {
    const signs = [
        'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
        'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'
    ];
    return signs[(year - 4) % 12];
};


const getHoroscope = async (zodiacSign) => {
    const url = `https://www.chinahighlights.com/travelguide/chinese-zodiac/${zodiacSign}.htm`;
                
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const horoscope = $('div.list_content p').eq(1).text().trim(); // eq(1) znači da uzimamo drugi paragraf p sa stranice list_content- prvi je 0

        if (!horoscope) {
            return "Horoskop nije pronađen. Probajte ponovo kasnije.";
        }

        return horoscope;
    } catch (error) {
        console.error('Greška pri dohvaćanju podataka s horoskopu:', error);
        return "Greška pri dohvaćanju podataka s horoskopu. Probajte ponovo kasnije.";
    }
};









app.post('/dodaj', async (req, res) => {
    const { name, birthYear } = req.body;
    if (name.charAt(0) !== name.charAt(0).toUpperCase() || /[^a-zA-ZčćžšđČĆŽŠĐ]/.test(name)) {
        return res.status(400).send('Ime mora započinjati velikim slovom i sastojati se samo od slova.');
    }
   
    if (!name || !birthYear) {
        return res.status(400).send('Obavezno je unjeti i ime i godinu.');
    }
    

    


    const zodiacSign = getChineseZodiac(birthYear);
    const horoscope = await getHoroscope(zodiacSign);

    const userData = { name, birthYear, zodiacSign, horoscope };

    //spremanje podataka u json
    fs.readFile('users.json', (err, data) => {
        const users = data ? JSON.parse(data) : [];
        users.push(userData);
        fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Greška s poslužiteljske strane.');
            res.json({ message: 'Osoba dodana!', zodiacSign, horoscope });
        });
    });
});







app.get('/osobe', (req, res) => {
    fs.readFile('users.json', (err, data) => {
        if (err) {
            return res.status(500).send('Greška s poslužiteljske strane.');
        }
        const users = data ? JSON.parse(data) : [];
        res.json(users);
    });
});






app.put('/azuriraj', (req, res) => {
    const { index, newName, newBirthYear } = req.body;
    if (newName.charAt(0) !== newName.charAt(0).toUpperCase() || /[^a-zA-ZčćžšđČĆŽŠĐ]/.test(newName)) {
        return res.status(400).send('Ime mora započinjati velikim slovom i sastojati se samo od slova');
    }
    

    if (index === undefined || (!newName && !newBirthYear)) {
        return res.status(400).send('Obavezan unos indexa i ili imena ili godine');
    }


    fs.readFile('users.json', (err, data) => {
        if (err) {
            return res.status(500).send('Greška s poslužiteljske strane.');
        }

        const users = JSON.parse(data);
        if (users[index]) {
            
            if (newName) {
                users[index].name = newName;
            }

            //azuriranje godine i horoskopskog znaka
            if (newBirthYear) {
                users[index].birthYear = newBirthYear;
                users[index].zodiacSign = getChineseZodiac(newBirthYear);
                getHoroscope(users[index].zodiacSign).then(horoscope => {
                    users[index].horoscope = horoscope;

                    
                    fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
                        if (err) {
                            return res.status(500).send('Greška s poslužiteljske strane.');
                        }
                        res.json({ message: 'Podaci ažurirani!', users });
                    });
                }).catch(error => {
                    return res.status(500).send('Greška s poslužiteljske strane.');
                });
            } else {
                // ako se godina ne unese, updejta se samo ime
                fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
                    if (err) {
                        return res.status(500).send('Greška s poslužiteljske strane.');
                    }
                    res.json({ message: 'Podaci ažurirani!', users });
                });
            }
        } else {
            return res.status(404).send('Osoba nije pronađena.');
        }
    });
});




app.delete('/izbrisi', (req, res) => {
    const { index } = req.body;
    if (index === undefined) {
        return res.status(400).send('Potreban je unos indexa za brisanje.');
    }

    fs.readFile('users.json', (err, data) => {
        if (err) {
            return res.status(500).send('Greška s poslužiteljske strane.');
        }

        const users = JSON.parse(data);
        if (users[index]) {
            
            users.splice(index, 1);

            fs.writeFile('users.json', JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    return res.status(500).send('Greška s poslužiteljske strane.');
                }
                res.json({ message: 'Osoba izbrisana!', users });
            });
        } else {
            return res.status(404).send('Osoba nije pronađena.');
        }
    });
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

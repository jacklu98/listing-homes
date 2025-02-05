import express, { Request, Response } from 'express';
import { readHomeList, scrapeHomes } from './homes.service';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            res.status(400).json({ message: 'City is required.' });
        }
        res.json({ message: `Start searching homes in ${city}, please wait.` });
        await scrapeHomes(city);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ message: 'Scraping failed.' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    const city = req.query.city as string | undefined;
    if (!city) {
        res.status(400).json({ message: 'City is required.' });
        return;
    }
    const page = req.query?.page as string | undefined;
    const pageSize = req.query?.pageSize as string | undefined;
    try {
        const homeList = await readHomeList(city, page, pageSize);
        res.json(homeList);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            res.status(400).json({ message: 'City is not found in data, try to scrape first.' });
        }
    }
});

export default router;

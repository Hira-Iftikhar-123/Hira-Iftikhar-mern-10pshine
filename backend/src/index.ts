import app from './app';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});



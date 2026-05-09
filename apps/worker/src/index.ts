import "dotenv/config";
import { worker } from './worker.js';

console.log(" Starting QuizMaster Background Worker...");

// Process listener to keep it alive (though Worker keeps event loop active)
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing worker');
    await worker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing worker');
    await worker.close();
    process.exit(0);
});

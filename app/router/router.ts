import express, { Response, Request, NextFunction } from "express";
import puppeteer, { Browser } from "puppeteer";

type RouteHandle = (req: Request, res: Response, next: NextFunction) => void | Promise<void>

export class Router {

    protected app;
    protected puppeteer;


    constructor(port: number = 3000) {
        this.app = express();
        this.app.use(express.json());
        this.puppeteer = puppeteer;
        this.puppeteer.launch({
            headless: true,
            slowMo: 50
        })
        this.app.listen(port, () => {
            console.log(`Server listening on http://localhost:${port}`);
        });
    }


    get({ path, callback }: { path: string, callback: RouteHandle }) {
        this.app.get(path, async (req, res, next) => {
            try {
                await callback(req, res, next);
            } catch (error) {
                console.error(`Error on POST ${path}:`, error);
                res.status(500).json({
                    success: false,
                    error: (error as Error).message || "Internal Server Error"
                });
            }
        });
    }

    post({ path, callback }: { path: string, callback: RouteHandle }) {
        this.app.post(path, async (req, res, next) => {
            try {
                await callback(req, res, next);
            } catch (error) {
                console.error(`Error on POST ${path}:`, error);
                res.status(500).json({
                    success: false,
                    error: (error as Error).message || "Internal Server Error"
                });
            }
        });
    }

    put({ path, callback }: { path: string, callback: RouteHandle }) {
        this.app.put(path, async (req, res, next) => {
            try {
                await callback(req, res, next);
            } catch (error) {
                console.error(`Error on PUT ${path}:`, error);
                res.status(500).json({
                    success: false,
                    error: (error as Error).message || "Internal Server Error"
                });
            }
        });
    }


    patch({ path, callback }: { path: string, callback: RouteHandle }) {
        this.app.patch(path, async (req, res, next) => {
            try {
                await callback(req, res, next);
            } catch (error) {
                console.error(`Error on patch ${path}:`, error);
                res.status(500).json({
                    success: false,
                    error: (error as Error).message || "Internal Server Error"
                });
            }
        });
    }

    delete({ path, callback }: { path: string, callback: RouteHandle }) {
        this.app.delete(path, async (req, res, next) => {
            try {
                await callback(req, res, next);
            } catch (error) {
                console.error(`Error on DELETE ${path}:`, error);
                res.status(500).json({
                    success: false,
                    error: (error as Error).message || "Internal Server Error"
                });
            }
        });
    }

}
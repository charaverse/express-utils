import { Request, Response, NextFunction, RequestHandler } from "express";
import { createTestResponse } from "..";

function testHandle<T = void>(
  fn: (req: Request, res: Response) => T | Promise<T>,
  opts: {
    isMiddleware?: boolean;
  } = {}
): RequestHandler {
  const { isMiddleware = false } = opts;

  return (req, res, next): void => {
    (async (): Promise<void> => {
      const data = await fn(req, res);

      if (res.headersSent) {
        return;
      }

      if (isMiddleware) {
        next();
        return;
      }

      res.send(data);
    })().catch(next);
  };
}

it("should send data from fn", async () => {
  const { payload } = await createTestResponse([
    testHandle(() => ({ foo: "bar" })),
  ]);

  expect(JSON.parse(payload)).toEqual({ foo: "bar" });
});

it("should continue to next middleware if middleware is true", async () => {
  const { payload } = await createTestResponse([
    testHandle(
      (req, res) => {
        res.status(201);
      },
      { isMiddleware: true }
    ),
    (req: Request, res: Response): void => {
      res.send("foo");
    },
  ]);

  expect(payload).toEqual("foo");
});

it("should not continue to next middleware if headers is sent", async () => {
  const { statusCode, payload } = await createTestResponse([
    testHandle((req: Request, res: Response) => {
      res.sendStatus(201);
    }),
    (req: Request, res: Response): void => {
      res.send("foo");
    },
  ]);

  expect(statusCode).toEqual(201);
  expect(payload).toEqual("Created");
});

it("should send error to error handler", async () => {
  const { statusCode, payload } = await createTestResponse([
    testHandle(() => {
      throw new Error("Oh noes");
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: Error, req: Request, res: Response, next: NextFunction): void => {
      res.status(500).send(err.message);
    },
  ]);

  expect(statusCode).toEqual(500);
  expect(payload).toEqual("Oh noes");
});

it("should not trigger next handler if isMiddleware is true and handler function already send response", async () => {
  const { payload } = await createTestResponse([
    testHandle(
      (req, res) => {
        res.send("ristarte best waifu");
      },
      { isMiddleware: true }
    ),
    testHandle(
      (req, res) => {
        res.send("ristarte damegami");
      },
      { isMiddleware: true }
    ),
  ]);

  expect(payload).toEqual("ristarte best waifu");
});

it("should not send any payload if fn returns undefined", async () => {
  const { payload } = await createTestResponse([
    testHandle(() => {
      return;
    }),
  ]);

  expect(payload).toEqual("");
});

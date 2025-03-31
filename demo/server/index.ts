import type { DefineExpressRoutes } from '@gfxlabs/astro-express';
import type { Router } from 'express';

const defineRoutes: DefineExpressRoutes = (app: Router) => {
  app.get('/api/todos', function(request, reply) {
    reply.send({
      todos: [
        { label: 'good morning'},
      ]
    });
  })
};

export default defineRoutes;

#!/bin/bash
\cp -f  rpc-client/mailbox.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/
\cp -f  rpc-client/mailboxes/tcp-mailbox.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-client/mailboxes/
\cp -f  rpc-server/acceptor.js  /usr/lib/node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/
\cp -f  connectors/hybridsocket.js  /usr/lib/node_modules/pomelo/lib/connectors/
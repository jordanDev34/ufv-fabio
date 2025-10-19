-- ==========================================================================
-- Remplit les tables clients / transports / produits avec données fictives
-- Jordan — 17/10/2025
-- ==========================================================================

begin;

-- TABLE CLIENTS
insert into clients (nom, prenom, email, telephone) values
  ('LAUBRIE', 'Jordan', 'demo@exemple.com', '0600000001'),
  ('PATERNA', 'Renaud', 'renaud@example.com', '0600000002'),
  ('DUPONT', 'Fabio', 'fabio@example.com', '0600000003')
on conflict (id) do nothing;

-- TABLE TRANSPORTS
insert into transports (nom, telephone) values
  ('DHL',   '0800 000 001'),
  ('FedEx', '0800 000 002'),
  ('UPS',   '0800 000 003')
on conflict (id) do nothing;

-- TABLE PRODUITS
insert into produits (nom) values
  ('Planche à Emboîtement'),
  ('Connecteur d''angle galvanisé'),
  ('Équerre menuiserie de fixation INOX'),
  ('Granulés de Bois DIN (sac 15 kg)'),
  ('Madrier Épicéa abouté')
on conflict (id) do nothing;

commit;

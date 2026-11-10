# Security

Reversium is local-first and makes network requests only in `own_site_verify` (one DNS lookup and one HTTPS GET of a well-known file on a domain you are verifying) and `own_site_headers` (one GET of that verified domain's homepage). Nothing else leaves your machine.

To report a problem with this software or with reversium.com, open a private security advisory on this repository.

Please do not use Reversium to test systems you do not control. See [AUP.md](AUP.md).

import truststore

# Some sites (e.g. predoc.org) serve an incomplete certificate chain (missing
# intermediate). Browsers tolerate this by fetching the missing intermediate
# via the cert's AIA extension; delegate verification to the OS trust store,
# which does the same, instead of failing like certifi's static bundle does.
truststore.inject_into_ssl()

from .read import read
from .extract import extract
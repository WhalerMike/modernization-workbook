"""Developer workbook Chapter 02: run Microsoft's pinned Graph SDK snippets against stand-ins.

The snippets (examples/third_party/msgraph-snippets-python) are loaded unmodified. Only the
packages they import are replaced, by recorders that keep each constructor's arguments, so
the tests see what the snippet would sign in to and call without installing the SDK,
signing in, or touching the network. Each test pins one row of the chapter's gap table.
"""

import importlib.util
import sys
import types
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
SAMPLE = HERE.parents[2] / "third_party" / "msgraph-snippets-python" / "src" / "snippets"
sys.path.insert(0, str(HERE.parents[1] / "python"))

from graphkit import azure_identity_provider, scope_for  # noqa: E402


class Recorder:
    """Stands in for an SDK class: records its arguments, does nothing else."""

    made: list = []

    def __init__(self, *args, **kwargs):
        self.args, self.kwargs = args, kwargs
        Recorder.made.append(self)

    def get_token(self, scope):
        return types.SimpleNamespace(token=f"token-for:{scope}")


def recorder(name):
    return type(name, (Recorder,), {})


class NationalClouds:
    """Symbols only: the test checks which constant the snippet passes, not its value."""

    Global, US_GOV, China = "NationalClouds.Global", "NationalClouds.US_GOV", "NationalClouds.China"


class GraphClientFactory:
    calls: list = []

    @staticmethod
    def create_with_default_middleware(**kwargs):
        GraphClientFactory.calls.append(kwargs)
        return ("http_client", kwargs)


class AzureAuthorityHosts:
    AZURE_PUBLIC_CLOUD = object()
    AZURE_GOVERNMENT = object()


@pytest.fixture
def sdk(monkeypatch):
    Recorder.made, GraphClientFactory.calls = [], []
    identity = types.ModuleType("azure.identity")
    for n in ("InteractiveBrowserCredential", "DeviceCodeCredential", "UsernamePasswordCredential",
              "CertificateCredential", "ManagedIdentityCredential"):
        setattr(identity, n, recorder(n))
    identity.AzureAuthorityHosts = AzureAuthorityHosts
    aio = types.ModuleType("azure.identity.aio")
    for n in ("AuthorizationCodeCredential", "ClientSecretCredential", "CertificateCredential", "OnBehalfOfCredential"):
        setattr(aio, n, recorder(n))
    kiota = types.ModuleType("kiota_authentication_azure.azure_identity_authentication_provider")
    kiota.AzureIdentityAuthenticationProvider = recorder("AzureIdentityAuthenticationProvider")
    gsc = types.ModuleType("msgraph.graph_service_client")
    gsc.GraphServiceClient = recorder("GraphServiceClient")
    gra = types.ModuleType("msgraph.graph_request_adapter")
    gra.GraphRequestAdapter = recorder("GraphRequestAdapter")
    core = types.ModuleType("msgraph_core")
    core.GraphClientFactory, core.NationalClouds = GraphClientFactory, NationalClouds
    modules = {
        "azure": types.ModuleType("azure"), "azure.identity": identity, "azure.identity.aio": aio,
        "kiota_authentication_azure": types.ModuleType("kiota_authentication_azure"),
        "kiota_authentication_azure.azure_identity_authentication_provider": kiota,
        "msgraph": types.ModuleType("msgraph"), "msgraph.graph_service_client": gsc,
        "msgraph.graph_request_adapter": gra, "msgraph_core": core,
    }
    for k, v in modules.items():
        monkeypatch.setitem(sys.modules, k, v)
    return modules


def load(name):
    spec = importlib.util.spec_from_file_location(f"pinned_{name}", SAMPLE / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def made(cls_name):
    return [r for r in Recorder.made if type(r).__name__ == cls_name]


def test_sample_us_gov_client_sets_scope_and_graph_host(sdk):
    load("national_clouds").NationalCloudClients.create_client_for_us_gov()
    (provider,) = made("AzureIdentityAuthenticationProvider")
    assert provider.kwargs["scopes"] == ["https://graph.microsoft.us/.default"] == [scope_for("gcchigh")]
    assert GraphClientFactory.calls == [{"host": NationalClouds.US_GOV}]


def test_sample_us_gov_credential_names_no_authority(sdk):
    # Gap: azure-identity's default authority is the public cloud (login.microsoftonline.com).
    # The C# and TypeScript tabs of the same Learn page set the US Government authority; this one doesn't.
    load("national_clouds").NationalCloudClients.create_client_for_us_gov()
    (cred,) = made("InteractiveBrowserCredential")
    assert "authority" not in cred.kwargs
    assert set(cred.kwargs) == {"tenant_id", "client_id", "redirect_uri"}


def test_sample_has_one_national_cloud_function_and_no_dod(sdk):
    clients = load("national_clouds").NationalCloudClients
    assert [n for n in vars(clients) if n.startswith("create_")] == ["create_client_for_us_gov"]


def test_sample_certificate_client_is_worldwide_only(sdk):
    load("create_clients").CreateClients.create_with_client_certificate()
    (cred,) = made("CertificateCredential")
    (client,) = made("GraphServiceClient")
    assert "authority" not in cred.kwargs
    assert client.args[1] == ["https://graph.microsoft.com/.default"]  # right for worldwide and GCC only


def test_sample_offers_a_client_secret(sdk):
    # The examples never accept a secret; the sample shows one for the client credentials flow.
    load("create_clients").CreateClients.create_with_client_secret()
    (cred,) = made("ClientSecretCredential")
    assert "client_secret" in cred.kwargs


@pytest.mark.parametrize("cloud, expected", [("gcc", "AZURE_PUBLIC_CLOUD"), ("gcchigh", "AZURE_GOVERNMENT"), ("dod", "AZURE_GOVERNMENT")])
def test_our_provider_sets_the_authority_for_every_cloud(sdk, cloud, expected):
    provider = azure_identity_provider(cloud, "00000000-0000-0000-0000-000000000000", "11111111-1111-1111-1111-111111111111", "app.pem")
    (cred,) = made("CertificateCredential")
    assert cred.kwargs["authority"] is getattr(AzureAuthorityHosts, expected)
    assert provider(scope_for(cloud)) == f"token-for:{scope_for(cloud)}"


def test_our_provider_refuses_an_unknown_cloud_before_building_a_credential(sdk):
    with pytest.raises(ValueError):
        azure_identity_provider("GCCHigh", "t", "c", "app.pem")
    assert Recorder.made == []

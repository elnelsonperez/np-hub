from bluetooth import *
import thread
import json
import sys
import bluetoothctl

class Type:
    RETURN = "RETURN"
    EXCEPTION = "EXCEPTION"
    LOG = "LOG"
    EVENT = "EVENT"

class bluetoothManager:
    connections = {}
    listenCounter = 0
    bluetoothctl = None
    config = None

    def __init__(self):
        self.bluetoothctl = bluetoothctl.Bluetoothctl()
        self.bluetoothctl.set_default_agent()
        thread.start_new_thread(self.read_input, ())
        self.create_server()
        if sys.argv[1]:
            self.config = json.loads(sys.argv[1])
        if self.config.get("autoPair") \
                and self.config.get("autoPair") == True:
            self.turn_on_auto_pair()
        if self.config.get("discoverable") \
                and self.config.get("discoverable") == True:
            self.make_discoverable()
        self.output(Type.EVENT, "INITIALIZED")

    def make_discoverable(self):
        self.bluetoothctl.make_discoverable()

    def turn_on_auto_pair(self):
        self.bluetoothctl.auto_accept_on = True

    def turn_off_auto_pair(self):
        self.bluetoothctl.auto_accept_on = False

    def read_input (self):
        while True:
            data = raw_input()
            if len(data) == 0: break
            self.parse_input_command(data)
            time.sleep(0.08)

    def parse_input_command(self, command):
        action_and_params = command.split("|")
        action = action_and_params[0]
        method = action_and_params[1]
        params = None
        if action_and_params[2]:
            params = json.loads(action_and_params[2])

        if action and method:
            if action == "invoke":
                self.invoke(method, params)
            else:
                self.output(Type.LOG, "UNRECOGNIZED_ACTION")

    def invoke(self, method, args):
        retobj = {}
        if "mac_address" in args:
            retobj["mac_address"] = args.get("mac_address")
        if "corr_id" in args:
            retobj["corr_id"] = args.get("corr_id")

        retobj["return"] = getattr(self, method)(args)
        self.output(Type.RETURN, args.get("method"), json.dumps(retobj))

    def create_server(self):
        self.listenCounter = self.listenCounter + 1
        server_sock = BluetoothSocket(RFCOMM)
        server_sock.bind(("", PORT_ANY))
        server_sock.listen(self.listenCounter)
        port = server_sock.getsockname()[1]
        uuid = "7f3d94e2-7fdf-44c7-813a-131727f5faef"
        advertise_service(server_sock, "NP Server",
                          service_id=uuid,
                          service_classes=[uuid, SERIAL_PORT_CLASS],
                          profiles=[SERIAL_PORT_PROFILE]
                          )
        thread.start_new_thread(self.wait_for_connections, (server_sock,))
        self.output(Type.EVENT, "SERVER_CREATED",  json.dumps({"channel": port}))

    def wait_for_connections (self, server_sock):
        client_sock, client_info = server_sock.accept()
        mac_address = client_info[0]
        # Mac address validation
        if self.config \
                and self.config.get('allowedMacAddreses') \
                and mac_address not in self.config.get('allowedMacAddreses'):
            client_sock.close()
            server_sock.close()
        else:
            self.output(Type.EVENT,"NEW_CONNECTION", json.dumps({"mac_address": mac_address}))
            self.connections[mac_address] = {"client_sock": client_sock, "server_sock": server_sock}
            thread.start_new_thread(self.read_from_client, (mac_address,))
            #always keep a server up for new connections
        self.create_server()

    def get_connected_devices(self):
        return list(self.connections.keys())

    def write_to_client (self, args):
        mac_address = args.get("mac_address")
        reach_device = args.get("reach_device")
        if mac_address:
            payload = {}
            if reach_device:
                payload["corr_id"] = args.get("corr_id")
            payload["payload"] = args.get("payload")
            client = self.connections.get(mac_address)
            try:
                client.get("client_sock").send(payload + "\n")
                return True
            except IOError as e:
                client.get("client_sock").close()
                client.get("server_sock").close()
                self.output(Type.EVENT, "DISCONNECTED", json.dumps({"mac_address": mac_address}))
        self.output(Type.LOG, "write_to_client", "Invalid mac address")

    def output (self, type, name, payload = None):
        output = type+"|"+name
        if payload is not None:
            output = output + "|" + payload
        print(output)
        sys.stdout.flush()

    def read_from_client (self, mac_address):
        client = self.connections.get(mac_address)
        try:
            while True:
                data = client.get("client_sock").recv(1024)
                if len(data) == 0: break
                self.output(Type.EVENT, "RECEIVED", json.dumps({"mac_address": mac_address, "data": data}))
                self.write_to_client( {"mac_address": mac_address, "payload": "Mensaje Recibido"})
                time.sleep(0.08)
        except IOError as e:
            pass

        client.get("client_sock").close()
        client.get("server_sock").close()
        self.output(Type.EVENT, "DISCONNECTED",json.dumps({"mac_address": mac_address}))

if __name__ == "__main__":

    obj = bluetoothManager()
    while True:
        pass





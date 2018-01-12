from bluetooth import *
import thread
import json
import sys
import bluetoothctl
import time


class Type:
    RETURN = "RETURN"
    EXCEPTION = "EXCEPTION"
    LOG = "LOG"
    EVENT = "EVENT"


class BluetoothManager:
    connections = {}
    bluetoothctl = None
    config = None
    serverSock = None

    def __init__(self):
        self.createNewServerSignal = False
        self.bluetoothctl = bluetoothctl.Bluetoothctl()
        thread.start_new_thread(self.read_input, ())
        thread.start_new_thread(self.create_server, ())
        try:
            cnf = sys.argv[1]
            if cnf == "auto":
                self.turn_on_auto_pair()
                self.make_discoverable()
            else:
                self.config = json.loads(cnf)
                if self.config.get("autoPair") \
                        and self.config.get("autoPair") is True:
                    self.turn_on_auto_pair()
                if self.config.get("discoverable") \
                        and self.config.get("discoverable") is True:
                    self.make_discoverable()
        except IndexError:
            pass
        self.output(Type.EVENT, "INITIALIZED")
        while True:
            # Check child signals
            if self.createNewServerSignal is True:
                time.sleep(2)
                thread.start_new_thread(self.create_server, ())
                self.createNewServerSignal = False
            time.sleep(0.2)

    def make_discoverable(self, args = None):
        self.log("Make discoverable called")
        self.bluetoothctl.make_discoverable()

    def turn_on_auto_pair(self):
        self.log("Autopair enabled")
        self.bluetoothctl.auto_accept_on = True

    def turn_off_auto_pair(self):
        self.log("Autopair disabled")
        self.bluetoothctl.auto_accept_on = False

    def log(self, msg):
        pass
        print "~ " + msg

    def read_input(self):
        while True:
            data = raw_input()
            if len(data) == 0: break
            self.parse_input_command(data)
            time.sleep(0.1)

    def parse_input_command(self, command):
        self.log("Input command received: %s" % command)
        action_and_params = command.split("|")
        action = None
        method = None
        try:
            action = action_and_params[0]
            method = action_and_params[1]
            params = json.loads(action_and_params[2])
        except IndexError:
            params = None

        if action is not None and method is not None:
            if action == "invoke":
                thread.start_new_thread(self.invoke, (method, params))
            else:
                self.output(Type.EXCEPTION, "UNRECOGNIZED_ACTION")
        else:
            self.output(Type.EXCEPTION, "ACTION_OR_METHOD_MISSING")

    def invoke(self, method, args):
        retobj = {}
        if "mac_address" in args:
            retobj["mac_address"] = args.get("mac_address")
        if "corr_id" in args:
            retobj["corr_id"] = args.get("corr_id")

        self.log("Invoking method " + method)
        retobj["return"] = getattr(self, method)(args)
        if "reach_device" not in args or args.get("reach_device") is False:
            self.output(Type.RETURN, method, json.dumps(retobj))

    def get_connected_devices(self, args):
        return list(self.connections.keys())

    def create_server(self):
        if self.serverSock is None:
            server_sock = BluetoothSocket(RFCOMM)
            server_sock.bind(("", PORT_ANY))
            server_sock.listen(1)
            port = server_sock.getsockname()[1]
            uuid = "7f3d94e2-7fdf-44c7-813a-131727f5faef"
            advertise_service(server_sock, "NP Server",
                              service_id=uuid,
                              service_classes=[uuid, SERIAL_PORT_CLASS],
                              profiles=[SERIAL_PORT_PROFILE]
                              )
            self.serverSock = server_sock
        thread.start_new_thread(self.wait_for_connections, ())
        self.output(Type.EVENT, "AWAITING_NEW_CONNECTION")

    def wait_for_connections(self):
        client_sock, client_info = self.serverSock.accept()
        mac_address = client_info[0]
        # Mac address validation
        if self.config \
                and self.config.get('allowedMacAddreses') \
                and mac_address not in self.config.get('allowedMacAddreses'):
            self.disconnect_client(mac_address)
        else:
            thread.start_new_thread(self.read_from_client, (mac_address,))
            self.connections[mac_address] = client_sock
            self.output(Type.EVENT, "NEW_CONNECTION", json.dumps({"mac_address": mac_address}))
            # always keep a server up for new connections
        self.log("Setting create new server signal")
        self.createNewServerSignal = True

    def write_to_client(self, args):
        mac_address = args.get("mac_address")
        if mac_address:
            payload = {"corr_id": args.get("corr_id"),
                       "payload": args.get("payload"),
                       "type": args.get("type")}
            client = self.connections.get(mac_address)
            try:
                client.send(json.dumps(payload) + "\n")
                return True
            except IOError as e:
                self.disconnect_client(mac_address)
                self.output(Type.EVENT, "DISCONNECTED", json.dumps({"mac_address": mac_address}))
        self.output(Type.LOG, "write_to_client", "Invalid mac address")

    def disconnect_client(self, args_or_mac_address):
        if isinstance(args_or_mac_address, dict):
            mac_address = args_or_mac_address.get("mac_address")
        elif isinstance(args_or_mac_address, basestring):
            mac_address = args_or_mac_address
        else:
            return
        try:
            client = self.connections.get(mac_address)
            client.close()
            del self.connections[mac_address]
        except Exception, e:
            self.log("Exception disconneting client: " + e.message)

    def output(self, type, name, payload=None):
        output = type + "|" + name
        if payload is not None:
            output = output + "|" + payload
        print(output)

    def read_from_client(self, mac_address):
        client = self.connections.get(mac_address)
        try:
            while True:
                data = client.recv(1024)
                if len(data) == 0:
                    break
                self.log("Message received from %s" % mac_address)
                self.output(Type.EVENT, "RECEIVED", json.dumps({"mac_address": mac_address, "data": json.loads(data)}))
                self.write_to_client({"mac_address": mac_address, "payload": "Mensaje Recibido"})
                time.sleep(0.1)
        except IOError as e:
            print(e)
            pass

        self.disconnect_client(mac_address)
        self.output(Type.EVENT, "DISCONNECTED", json.dumps({"mac_address": mac_address}))


if __name__ == "__main__":
    obj = BluetoothManager()
